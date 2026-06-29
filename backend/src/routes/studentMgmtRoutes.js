const express = require("express");
const { query, queryOne } = require("../db/helpers");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const router = express.Router();
router.use(requireAuth);
router.use(requireRole("teacher"));

// GET /api/students — distinct students who joined this teacher's sessions
router.get("/", async (req, res) => {
  try {
    const rows = await query(
      `SELECT DISTINCT u.id, u.name, u.role, u.created_at
       FROM users u
       JOIN session_students ss ON u.id = ss.student_id
       JOIN sessions s ON ss.session_id = s.id
       WHERE s.teacher_id = ?
       ORDER BY u.name`,
      [req.user.id]
    );
    return sendSuccess(res, { students: rows });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Database error", 500);
  }
});

// GET /api/students/:id
router.get("/:id", async (req, res) => {
  try {
    const student = await queryOne(
      `SELECT u.id, u.name, u.role, u.created_at
       FROM users u
       JOIN session_students ss ON u.id = ss.student_id
       JOIN sessions s ON ss.session_id = s.id
       WHERE u.id = ? AND u.role = 'student' AND s.teacher_id = ?
       LIMIT 1`,
      [req.params.id, req.user.id]
    );
    if (!student) return sendError(res, "NOT_FOUND", "Student not found", 404);
    return sendSuccess(res, { student });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Database error", 500);
  }
});

// GET /api/students/:id/results
router.get("/:id/results", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const ok = await queryOne(
      `SELECT 1 FROM session_students ss
       JOIN sessions s ON ss.session_id=s.id
       WHERE ss.student_id=? AND s.teacher_id=? LIMIT 1`,
      [req.params.id, req.user.id]
    );
    if (!ok) return sendError(res, "NOT_FOUND", "Student not found", 404);

    const totalRow = await queryOne(
      `SELECT COUNT(*) as c FROM submissions sub
       JOIN sessions s ON sub.session_id=s.id
       WHERE sub.student_id=? AND s.teacher_id=?`,
      [req.params.id, req.user.id]
    );
    const total = totalRow?.c ?? 0;

    const rows = await query(
      `SELECT sub.score, sub.submitted_at, q.title as quizTitle, q.id as quizId
       FROM submissions sub
       JOIN sessions s ON sub.session_id=s.id
       JOIN quizzes q ON s.quiz_id=q.id
       WHERE sub.student_id=? AND s.teacher_id=?
       ORDER BY sub.submitted_at DESC
       LIMIT ? OFFSET ?`,
      [req.params.id, req.user.id, limit, offset]
    );

    return sendSuccess(res, {
      results: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Database error", 500);
  }
});

// POST /api/students/:studentId/quiz/:quizId — ensure session exists / student linked (optional helper)
router.post("/:studentId/quiz/:quizId", async (req, res) => {
  try {
    const quiz = await queryOne("SELECT * FROM quizzes WHERE id=? AND teacher_id=?", [
      req.params.quizId,
      req.user.id,
    ]);
    if (!quiz) return sendError(res, "BIZ_001", "Quiz not found", 404);

    const student = await queryOne("SELECT id FROM users WHERE id=? AND role='student'", [
      req.params.studentId,
    ]);
    if (!student) return sendError(res, "NOT_FOUND", "Student not found", 404);

    const session = await queryOne(
      "SELECT * FROM sessions WHERE quiz_id=? AND teacher_id=? ORDER BY created_at DESC LIMIT 1",
      [quiz.id, req.user.id]
    );
    if (!session) {
      return sendError(res, "BIZ_001", "No session for this quiz — publish the quiz first", 404);
    }

    await query("INSERT IGNORE INTO session_students (session_id, student_id) VALUES (?,?)", [
      session.id,
      student.id,
    ]);

    return sendSuccess(res, { sessionId: session.id, joinCode: session.join_code });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Database error", 500);
  }
});

module.exports = router;
