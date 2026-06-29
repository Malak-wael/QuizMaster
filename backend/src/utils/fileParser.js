const fs = require("fs").promises;
const path = require("path");

function parseCsv(raw) {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error("CSV upload requires header row plus at least one question row.");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}

function normalizeOptions(value) {
  if (!value) return [];
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function parseUploadedQuizFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const raw = await fs.readFile(filePath, "utf8");

  if (ext === ".json") {
    const payload = JSON.parse(raw);
    if (!Array.isArray(payload.questions)) {
      throw new Error("JSON upload must include a questions array.");
    }
    return payload;
  }

  if (ext === ".csv") {
    const rows = parseCsv(raw);
    return {
      title: rows[0].quiztitle || rows[0].title || "Imported Quiz",
      description: rows[0].description || "",
      teacherName: rows[0].teachername || "Imported Teacher",
      teacherEmail: rows[0].teacheremail || "teacher@example.com",
      questions: rows.map((row) => ({
        text: row.question || row.questiontext || "",
        type: row.type || "multiple-choice",
        options: normalizeOptions(row.options || row.choices || ""),
        correctAnswer: row.correctanswer || row.answer || "",
        score: Number(row.score || 1),
      })),
    };
  }

  throw new Error("Unsupported file type for upload.");
}

module.exports = { parseUploadedQuizFile };