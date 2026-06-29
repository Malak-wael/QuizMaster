import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

dotenv.config();

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "quizmaster";

async function hasColumn(
  conn: mysql.Connection,
  tableName: string,
  columnName: string
) {
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [DB_NAME, tableName, columnName]
  );
  return rows.length > 0;
}

async function ensureTeacherUser(conn: mysql.Connection) {
  const passwordHash = await bcrypt.hash("password123", 10);
  const emailColumnExists = await hasColumn(conn, "users", "email");

  if (emailColumnExists) {
    await conn.execute(
      `INSERT INTO users (id, name, email, role, password_hash)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         email = VALUES(email),
         role = VALUES(role),
         password_hash = VALUES(password_hash)`,
      ["t1", "teacher1", "teacher1@demo.local", "teacher", passwordHash]
    );
    return;
  }

  await conn.execute(
    `INSERT INTO users (id, name, role, password_hash)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       role = VALUES(role),
       password_hash = VALUES(password_hash)`,
    ["t1", "teacher1", "teacher", passwordHash]
  );
}

async function verifyRoleRequirements(conn: mysql.Connection) {
  const [userRows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT id, name, role FROM users WHERE LOWER(name)=LOWER(?) LIMIT 1`,
    ["teacher1"]
  );

  if (!userRows.length) {
    throw new Error("teacher1 user was not found after upsert");
  }

  const user = userRows[0];
  const role = String(user.role || "").toLowerCase();
  const roleAcceptedByAuth = role === "teacher" || role === "student";

  console.log("✅ teacher1 record:");
  console.log(`   id: ${user.id}`);
  console.log(`   role: ${user.role}`);
  console.log(
    `   role accepted by current auth logic: ${roleAcceptedByAuth ? "YES" : "NO"}`
  );
  if (role !== "teacher") {
    console.log("⚠️ role is not teacher. This script just corrected it to teacher.");
  }
}

async function main() {
  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    });

    await ensureTeacherUser(conn);
    await verifyRoleRequirements(conn);

    console.log("✅ Auth fix complete.");
    console.log("   Login with username: teacher1");
    console.log("   Login with password: password123");
  } catch (error) {
    console.error("❌ fix-auth failed:", (error as Error).message);
    process.exitCode = 1;
  } finally {
    if (conn) await conn.end();
  }
}

main();
