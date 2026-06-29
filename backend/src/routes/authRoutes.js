const express = require("express");
const bcrypt = require("bcryptjs");
const { query, queryOne, generateId } = require("../db/helpers");
const { requireAuth } = require("../middleware/auth");
const { signToken } = require("../utils/jwt");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const router = express.Router();

// Normalize a WhatsApp number to international format without "+" or spaces.
// Accepts inputs like "+20 100 123 4567", "0020-100-1234567", "01001234567".
// If the number starts with a leading 0 we assume Egypt and prefix "20".
function normalizeWhatsapp(raw) {
  if (raw === undefined || raw === null) return null;
  let n = String(raw).trim();
  if (!n) return null;
  n = n.replace(/[^\d+]/g, "");          // keep digits and "+"
  if (n.startsWith("00")) n = n.slice(2); // 0020... -> 20...
  if (n.startsWith("+")) n = n.slice(1);  // +20...  -> 20...
  if (n.startsWith("0")) n = "20" + n.slice(1); // local EG -> international
  if (!/^\d{8,15}$/.test(n)) return false; // invalid -> signal error
  return n;
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, password, role, email } = req.body;
  // accept either parentWhatsapp (camelCase) or parent_whatsapp (snake_case)
  const rawParent = req.body.parentWhatsapp ?? req.body.parent_whatsapp;

  if (!name || !password || !role)
    return sendError(res, "VALID_001", "name, password and role are required", 400);
  if (!["teacher", "student"].includes(role))
    return sendError(res, "VALID_001", "role must be teacher or student", 400);

  // Parent WhatsApp is required for students
  let parentWhatsapp = null;
  if (role === "student") {
    if (!rawParent)
      return sendError(res, "VALID_001", "parentWhatsapp is required for students", 400);
    const normalized = normalizeWhatsapp(rawParent);
    if (normalized === false)
      return sendError(res, "VALID_001", "parentWhatsapp is not a valid phone number", 400);
    parentWhatsapp = normalized;
  }

  try {
    const existing = await queryOne("SELECT id FROM users WHERE LOWER(name)=LOWER(?)", [name]);
    if (existing) return sendError(res, "CONFLICT", "User already exists", 409);

    if (email) {
      const emailTaken = await queryOne("SELECT id FROM users WHERE LOWER(email)=LOWER(?)", [email]);
      if (emailTaken) return sendError(res, "CONFLICT", "Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = generateId("u");

    try {
      await query(
        "INSERT INTO users (id,name,email,role,password_hash,parent_whatsapp) VALUES (?,?,?,?,?,?)",
        [id, name, email || null, role, passwordHash, parentWhatsapp]
      );
    } catch (e) {
      const msg = String(e.message);
      if (msg.includes("Unknown column 'parent_whatsapp'")) {
        // Column missing — fall back to insert without it (run the migration!)
        try {
          await query(
            "INSERT INTO users (id,name,email,role,password_hash) VALUES (?,?,?,?,?)",
            [id, name, email || null, role, passwordHash]
          );
        } catch (e2) {
          if (String(e2.message).includes("Unknown column 'email'")) {
            await query("INSERT INTO users (id,name,role,password_hash) VALUES (?,?,?,?)", [
              id, name, role, passwordHash,
            ]);
          } else throw e2;
        }
      } else if (msg.includes("Unknown column 'email'")) {
        await query("INSERT INTO users (id,name,role,password_hash) VALUES (?,?,?,?)", [
          id, name, role, passwordHash,
        ]);
      } else throw e;
    }

    const user = {
      id,
      name,
      role,
      ...(email && { email }),
      ...(parentWhatsapp && { parentWhatsapp }),
    };
    const token = signToken(user);
    return sendSuccess(res, { user, token }, "Registered", 201);
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Server error", 500);
  }
});

// POST /api/auth/login — accepts email or name
router.post("/login", async (req, res) => {
  const { name, email, password } = req.body;
  const identifier = email || name;
  if (!identifier || !password)
    return sendError(res, "VALID_001", "email or name, and password are required", 400);

  try {
    let user = await queryOne("SELECT * FROM users WHERE LOWER(email)=LOWER(?)", [identifier]);
    if (!user) user = await queryOne("SELECT * FROM users WHERE LOWER(name)=LOWER(?)", [identifier]);
    if (!user) return sendError(res, "AUTH_001", "Invalid credentials", 401);

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return sendError(res, "AUTH_001", "Invalid credentials", 401);

    const safe = { id: user.id, name: user.name, role: user.role };
    if (user.email) safe.email = user.email;
    if (user.parent_whatsapp) safe.parentWhatsapp = user.parent_whatsapp;
    const token = signToken(safe);
    return sendSuccess(res, { user: safe, token });
  } catch (err) {
    console.error(err);
    if (String(err.message).includes("Unknown column 'email'")) {
      try {
        const user = await queryOne("SELECT * FROM users WHERE LOWER(name)=LOWER(?)", [identifier]);
        if (!user) return sendError(res, "AUTH_001", "Invalid credentials", 401);
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return sendError(res, "AUTH_001", "Invalid credentials", 401);
        const safe = { id: user.id, name: user.name, role: user.role };
        if (user.parent_whatsapp) safe.parentWhatsapp = user.parent_whatsapp;
        const token = signToken(safe);
        return sendSuccess(res, { user: safe, token });
      } catch (e2) {
        console.error(e2);
        return sendError(res, "SYS_001", "Server error", 500);
      }
    }
    return sendError(res, "SYS_001", "Server error", 500);
  }
});

// POST /api/auth/logout (JWT client-side discard; hook for future blocklist)
router.post("/logout", requireAuth, (_req, res) => {
  return sendSuccess(res, { loggedOut: true });
});

// GET /api/auth/me — fetch fresh from DB so parentWhatsapp is always current
router.get("/me", requireAuth, async (req, res) => {
  try {
    const row = await queryOne(
      "SELECT id, name, role, email, parent_whatsapp FROM users WHERE id=?",
      [req.user.id]
    );
    if (!row) return sendSuccess(res, { user: req.user });
    const user = { id: row.id, name: row.name, role: row.role };
    if (row.email) user.email = row.email;
    if (row.parent_whatsapp) user.parentWhatsapp = row.parent_whatsapp;
    return sendSuccess(res, { user });
  } catch (e) {
    if (String(e.message).includes("Unknown column 'parent_whatsapp'")) {
      // migration not run yet — fall back gracefully
      return sendSuccess(res, { user: req.user });
    }
    console.error(e);
    return sendError(res, "SYS_001", "Server error", 500);
  }
});

// PUT /api/auth/profile — also lets the student update their parent number later
router.put("/profile", requireAuth, async (req, res) => {
  const { name, avatar } = req.body;
  const rawParent = req.body.parentWhatsapp ?? req.body.parent_whatsapp;
  try {
    if (name) {
      await query("UPDATE users SET name=? WHERE id=?", [name, req.user.id]);
      req.user.name = name;
    }
    if (avatar !== undefined) {
      try {
        await query("UPDATE users SET avatar=? WHERE id=?", [avatar, req.user.id]);
      } catch (e) {
        if (!String(e.message).includes("Unknown column 'avatar'")) throw e;
      }
    }
    if (rawParent !== undefined) {
      const normalized = normalizeWhatsapp(rawParent);
      if (normalized === false)
        return sendError(res, "VALID_001", "parentWhatsapp is not a valid phone number", 400);
      try {
        await query("UPDATE users SET parent_whatsapp=? WHERE id=?", [normalized, req.user.id]);
        req.user.parentWhatsapp = normalized;
      } catch (e) {
        if (!String(e.message).includes("Unknown column 'parent_whatsapp'")) throw e;
      }
    }
    return sendSuccess(res, { user: req.user });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Server error", 500);
  }
});

// GET /api/auth/debug-user/:name (development-only)
router.get("/debug-user/:name", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return sendError(res, "FORBIDDEN", "Not available in production", 403);
  }

  try {
    const user = await queryOne("SELECT * FROM users WHERE LOWER(name)=LOWER(?)", [
      req.params.name,
    ]);
    if (!user) {
      return sendError(res, "NOT_FOUND", "User not found", 404);
    }

    const passwordMatches123 = await bcrypt.compare(
      "password123",
      user.password_hash || ""
    );

    return sendSuccess(res, {
      exists: true,
      id: user.id,
      name: user.name,
      role: user.role,
      roleAcceptedByAuth: ["teacher", "student"].includes(String(user.role || "").toLowerCase()),
      hasPasswordHash: Boolean(user.password_hash),
      passwordMatchesPassword123: passwordMatches123,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Server error", 500);
  }
});

module.exports = router;
