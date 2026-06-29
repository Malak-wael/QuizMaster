require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
  const relPath = process.argv[2];
  if (!relPath) {
    console.error("Usage: node scripts/run-sql-file.js <relative-sql-file-path>");
    process.exit(1);
  }

  const sqlPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL file not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "quizmaster",
    multipleStatements: true,
  });

  try {
    await conn.query(sql);
    console.log(`✅ Applied SQL file: ${relPath}`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("❌ Failed to apply SQL file:", err.message);
  process.exit(1);
});
