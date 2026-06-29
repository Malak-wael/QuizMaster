const express = require("express");
const fs = require("fs");
const path = require("path");
const { query, queryOne } = require("../db/helpers");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
const uploadsDir = path.join(__dirname, "../../uploads");

router.use(requireAuth);
router.use(requireRole("teacher"));

function detectMimeType(filename) {
  const ext = String(path.extname(filename || "")).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".txt") return "text/plain; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".csv") return "text/csv; charset=utf-8";
  if (ext === ".docx")
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/octet-stream";
}

function buildFileSummary(upload) {
  const originalName = upload.original_name || upload.filename || "Unnamed file";
  return {
    id: upload.id,
    name: originalName,
    originalName,
    filename: upload.filename,
    type: path.extname(originalName).replace(".", "").toLowerCase() || "unknown",
    mimeType: detectMimeType(originalName),
    size: Number(upload.file_size || 0),
    status: upload.status,
    createdAt: upload.created_at,
    uploadDate: upload.created_at,
  };
}

router.get("/", async (req, res) => {
  try {
    const uploads = await query(
      "SELECT id, filename, original_name, file_size, status, created_at FROM pdf_uploads WHERE teacher_id=? ORDER BY created_at DESC",
      [req.user.id]
    );
    return res.json({ files: uploads.map(buildFileSummary) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unable to load files right now." });
  }
});

router.put("/:id", async (req, res) => {
  const nextName = String(req.body?.name ?? req.body?.originalName ?? "").trim();
  if (!nextName) return res.status(400).json({ message: "A non-empty file name is required." });
  if (nextName.length > 255) return res.status(400).json({ message: "File name is too long." });

  try {
    const upload = await queryOne(
      "SELECT id, filename, original_name, file_size, status, created_at FROM pdf_uploads WHERE id=? AND teacher_id=?",
      [req.params.id, req.user.id]
    );
    if (!upload) return res.status(404).json({ message: "File not found." });

    await query("UPDATE pdf_uploads SET original_name=? WHERE id=? AND teacher_id=?", [
      nextName,
      req.params.id,
      req.user.id,
    ]);
    const updated = { ...upload, original_name: nextName };
    return res.json({ file: buildFileSummary(updated), message: "File updated successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unable to update this file." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const upload = await queryOne(
      "SELECT id, filename FROM pdf_uploads WHERE id=? AND teacher_id=?",
      [req.params.id, req.user.id]
    );
    if (!upload) return res.status(404).json({ message: "File not found." });

    if (upload.filename) {
      const diskPath = path.join(uploadsDir, upload.filename);
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    }

    await query("DELETE FROM pdf_uploads WHERE id=? AND teacher_id=?", [req.params.id, req.user.id]);
    return res.json({ success: true, message: "File deleted successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unable to delete this file." });
  }
});

module.exports = router;
