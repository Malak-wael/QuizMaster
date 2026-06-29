require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("../src/db/connection");

async function columnExists(tableName, columnName) {
  const [rows] = await pool.execute(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [process.env.DB_NAME || "quizmaster", tableName, columnName]
  );
  return rows.length > 0;
}

async function upsertUser({ id, name, role, password, email }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const hasEmail = await columnExists("users", "email");

  if (hasEmail) {
    await pool.execute(
      `INSERT INTO users (id, name, email, role, password_hash)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         email = VALUES(email),
         role = VALUES(role),
         password_hash = VALUES(password_hash)`,
      [id, name, email, role, passwordHash]
    );
    return;
  }

  await pool.execute(
    `INSERT INTO users (id, name, role, password_hash)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       role = VALUES(role),
       password_hash = VALUES(password_hash)`,
    [id, name, role, passwordHash]
  );
}

async function main() {
  try {
    await upsertUser({
      id: "t1",
      name: "teacher1",
      role: "teacher",
      password: "password123",
      email: "teacher1@demo.local",
    });

    await upsertUser({
      id: "s1",
      name: "student1",
      role: "student",
      password: "password123",
      email: "student1@demo.local",
    });

    console.log("✅ Demo users ensured:");
    console.log("   Teacher: teacher1 / password123");
    console.log("   Student: student1 / password123");
  } catch (error) {
    console.error("❌ Failed to ensure demo users:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
