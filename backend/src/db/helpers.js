const { pool } = require("./connection");
const { v4: uuidv4 } = require("uuid");

// ── ID & Code generators ──────────────────────────────────
function generateId(prefix = "") {
  const id = uuidv4().replace(/-/g, "").slice(0, 16);
  return prefix ? `${prefix}_${id}` : id;
}

function generateJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Live game PIN: exactly 4 numeric digits (matches student UI). */
function generateGamePinDigits() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function generateUniqueGamePin() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const pin = generateGamePinDigits();
    const existing = await queryOne("SELECT id FROM game_sessions WHERE pin=?", [pin]);
    if (!existing) return pin;
  }
  throw new Error("Failed to generate unique game PIN");
}

function normalizeGamePin(pin) {
  const digits = String(pin ?? "").replace(/\D/g, "");
  return digits.length === 4 ? digits : null;
}

async function generateUniqueJoinCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = generateJoinCode();
    const existing = await queryOne("SELECT id FROM sessions WHERE join_code=?", [code]);
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique join code");
}

// ── Generic query helper ──────────────────────────────────
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

module.exports = {
  generateId,
  generateJoinCode,
  generateUniqueJoinCode,
  generateUniqueGamePin,
  normalizeGamePin,
  query,
  queryOne,
};
