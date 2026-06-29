const jwt = require("jsonwebtoken");
const { queryOne } = require("../db/helpers");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token)
    return res.status(401).json({ message: "Missing or invalid authorization header" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await queryOne("SELECT id, name, role FROM users WHERE id=?", [payload.sub]);
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/** Sets req.user when Bearer token is valid; continues without user if missing/invalid */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await queryOne("SELECT id, name, role FROM users WHERE id=?", [payload.sub]);
    if (user) req.user = user;
  } catch (_err) {
    /* ignore */
  }
  return next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (!allowedRoles.includes(req.user.role))
      return res.status(403).json({ message: "Forbidden for this role" });
    return next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
