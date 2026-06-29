const express = require("express");
const { query, queryOne, generateId, generateUniqueJoinCode } = require("../db/helpers");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getQuizWithQuestions } = require("./quizRoutes");
const { optionIdForIndex } = require("../utils/questionValidation");

const router = express.Router();

// GET /api/v1/sessions/public  (no auth needed)
router.get("/public", async (req, res) => {
  try {
    const rows = await query(
      "SELECT s.*, q.title FROM sessions s JOIN quizzes q ON s.quiz_id=q.id WHERE s.status IN ('waiting','live')"
    );
    const sessions = await Promise.all(rows.map(async s => {
      const countRow = await queryOne("SELECT COUNT(*) as cnt FROM session_students WHERE session_id=?", [s.id]);
      return { id: s.id, joinCode: s.join_code, status: s.status, quizId: s.quiz_id, title: s.title, participants: countRow.cnt };
    }));
    return res.json({ sessions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.use(requireAuth);

// POST /api/v1/sessions  (teacher creates session)
router.post("/", requireRole("teacher"), async (req, res) => {
  const { quizId } = req.body;
  if (!quizId) return res.status(400).json({ message: "quizId is required" });
  try {
    const quiz = await queryOne("SELECT * FROM quizzes WHERE id=?", [quizId]);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (quiz.teacher_id !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    const id = generateId("session");
    const joinCode = await generateUniqueJoinCode();
    await query(
      "INSERT INTO sessions (id,quiz_id,teacher_id,join_code,status) VALUES (?,?,?,?,?)",
      [id, quizId, req.user.id, joinCode, "waiting"]
    );
    const session = { id, quizId, teacherId: req.user.id, joinCode, status: "waiting" };
    return res.status(201).json({ session });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/v1/sessions  (teacher gets their sessions)
router.get("/", requireRole("teacher"), async (req, res) => {
  try {
    const rows = await query("SELECT * FROM sessions WHERE teacher_id=? ORDER BY created_at DESC", [req.user.id]);
    const sessions = rows.map(s => ({ id: s.id, quizId: s.quiz_id, joinCode: s.join_code, status: s.status, createdAt: s.created_at }));
    return res.json({ sessions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/v1/sessions/join  (student joins)
router.post("/join", requireRole("student"), async (req, res) => {
  const code = req.body.code || req.body.joinCode;
  if (!code) return res.status(400).json({ message: "code or joinCode is required" });
  try {
    const session = await queryOne("SELECT * FROM sessions WHERE join_code=?", [String(code)]);
    if (!session) return res.status(404).json({ message: "Invalid join code" });
    if (session.status === "completed") return res.status(400).json({ message: "Session already completed" });

    await query(
      "INSERT IGNORE INTO session_students (session_id,student_id) VALUES (?,?)",
      [session.id, req.user.id]
    );
    await query("UPDATE sessions SET status='live' WHERE id=? AND status='waiting'", [session.id]);
    const updated = await queryOne("SELECT * FROM sessions WHERE id=?", [session.id]);
    return res.json({
      session: {
        id: updated.id,
        quizId: updated.quiz_id,
        joinCode: updated.join_code,
        status: updated.status,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/v1/sessions/:sessionId
router.get("/:sessionId", requireRole("teacher", "student"), async (req, res) => {
  try {
    const session = await queryOne("SELECT * FROM sessions WHERE id=?", [req.params.sessionId]);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (req.user.role === "teacher" && session.teacher_id !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });

    if (req.user.role === "student") {
      const member = await queryOne("SELECT 1 FROM session_students WHERE session_id=? AND student_id=?", [session.id, req.user.id]);
      if (!member) return res.status(403).json({ message: "Join the session first" });
    }

    const students = await query(
      "SELECT u.id, u.name FROM session_students ss JOIN users u ON ss.student_id=u.id WHERE ss.session_id=?",
      [session.id]
    );
    return res.json({ session: { id: session.id, quizId: session.quiz_id, joinCode: session.join_code, status: session.status, students } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/v1/sessions/:sessionId/start  (teacher starts)
router.post("/:sessionId/start", requireRole("teacher"), async (req, res) => {
  try {
    const session = await queryOne("SELECT * FROM sessions WHERE id=?", [req.params.sessionId]);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.teacher_id !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    await query("UPDATE sessions SET status='live' WHERE id=?", [session.id]);
    return res.json({ session: { ...session, status: "live" } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/v1/sessions/:sessionId/submit  (student submits)
router.post("/:sessionId/submit", requireRole("student"), async (req, res) => {
  const { answers } = req.body;
  try {
    const session = await queryOne("SELECT * FROM sessions WHERE id=?", [req.params.sessionId]);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const member = await queryOne("SELECT 1 FROM session_students WHERE session_id=? AND student_id=?", [session.id, req.user.id]);
    if (!member) return res.status(403).json({ message: "Join the session first" });

    if (session.status !== "live") return res.status(400).json({ message: "Session is not live" });
    if (!Array.isArray(answers)) return res.status(400).json({ message: "answers must be an array" });

    const questions = await query("SELECT * FROM questions WHERE quiz_id=? ORDER BY sort_order", [session.quiz_id]);
    let score = 0;
    for (const ans of answers) {
      const q = questions[ans.questionIndex];
      if (!q) continue;
      const correctAnswerId =
        q.correct_answer_id || optionIdForIndex(Number(q.correct_option_index || 0));
      const byId =
        typeof ans.selectedAnswerId === "string" &&
        ans.selectedAnswerId.trim() &&
        ans.selectedAnswerId.trim() === correctAnswerId;
      const byIndex = Number(ans.selectedOptionIndex) === Number(q.correct_option_index);
      if (byId || byIndex) score++;
    }

    const subId = generateId("sub");
    await query(
      "INSERT INTO submissions (id,session_id,student_id,answers,score) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE answers=VALUES(answers),score=VALUES(score),submitted_at=NOW()",
      [subId, session.id, req.user.id, JSON.stringify(answers), score]
    );
    return res.json({ score, total: questions.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/v1/sessions/:sessionId/results
router.get("/:sessionId/results", requireRole("teacher", "student"), async (req, res) => {
  try {
    const session = await queryOne("SELECT * FROM sessions WHERE id=?", [req.params.sessionId]);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (req.user.role === "teacher") {
      if (session.teacher_id !== req.user.id) return res.status(403).json({ message: "Forbidden" });

      // Total number of questions in this quiz (so the teacher can compute %)
      const totalRow = await queryOne(
        "SELECT COUNT(*) AS c FROM questions WHERE quiz_id=?",
        [session.quiz_id]
      );
      const totalQuestions = totalRow?.c ?? 0;

      // Quiz title (used in the WhatsApp message)
      const quizRow = await queryOne(
        "SELECT title FROM quizzes WHERE id=?",
        [session.quiz_id]
      );

      let results;
      try {
        results = await query(
          `SELECT u.name AS studentName,
                  u.parent_whatsapp AS parentWhatsapp,
                  sub.score,
                  sub.submitted_at AS submittedAt,
                  u.id AS studentId
             FROM submissions sub
             JOIN users u ON sub.student_id = u.id
            WHERE sub.session_id = ?
            ORDER BY sub.score DESC`,
          [session.id]
        );
      } catch (e) {
        if (!String(e.message).includes("Unknown column 'u.parent_whatsapp'")) throw e;
        // fallback if migration not run yet
        results = await query(
          `SELECT u.name AS studentName,
                  sub.score,
                  sub.submitted_at AS submittedAt,
                  u.id AS studentId
             FROM submissions sub
             JOIN users u ON sub.student_id = u.id
            WHERE sub.session_id = ?
            ORDER BY sub.score DESC`,
          [session.id]
        );
      }

      return res.json({
        results,
        totalQuestions,
        quizTitle: quizRow?.title || "",
      });
    }

    const mine = await queryOne("SELECT * FROM submissions WHERE session_id=? AND student_id=?", [session.id, req.user.id]);
    if (!mine) return res.status(404).json({ message: "Result not found" });
    return res.json({ result: mine });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/v1/sessions/:sessionId/leaderboard
router.get("/:sessionId/leaderboard", requireRole("teacher", "student"), async (req, res) => {
  try {
    const session = await queryOne("SELECT * FROM sessions WHERE id=?", [req.params.sessionId]);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (req.user.role === "teacher" && session.teacher_id !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (req.user.role === "student") {
      const member = await queryOne(
        "SELECT 1 FROM session_students WHERE session_id=? AND student_id=?",
        [session.id, req.user.id]
      );
      if (!member) return res.status(403).json({ message: "Join the session first" });
    }

    const rows = await query(
      `SELECT u.id as studentId, u.name as studentName, sub.score, sub.submitted_at as submittedAt
       FROM submissions sub
       JOIN users u ON sub.student_id=u.id
       WHERE sub.session_id=?
       ORDER BY sub.score DESC, sub.submitted_at ASC`,
      [session.id]
    );

    const leaderboard = rows.map((row, index) => ({
      rank: index + 1,
      studentId: row.studentId,
      studentName: row.studentName,
      score: row.score,
      submittedAt: row.submittedAt,
    }));

    return res.json({ leaderboard });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
