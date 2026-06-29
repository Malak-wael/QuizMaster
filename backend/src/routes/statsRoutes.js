const express = require("express");
const { query, queryOne } = require("../db/helpers");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const router = express.Router();
router.use(requireAuth);
router.use(requireRole("teacher"));

// GET /api/stats/teacher — dashboard stats (API spec)
router.get("/teacher", async (req, res) => {
  try {
    const tid = req.user.id;

    const qCountRows = await query("SELECT COUNT(*) as cnt FROM quizzes WHERE teacher_id=?", [tid]);
    const sCountRows = await query(
      "SELECT COUNT(DISTINCT ss.student_id) as cnt FROM sessions s JOIN session_students ss ON s.id=ss.session_id WHERE s.teacher_id=?",
      [tid]
    );
    const activeRows = await query(
      "SELECT COUNT(*) as cnt FROM sessions WHERE teacher_id=? AND status IN ('waiting','live')",
      [tid]
    );
    const avgScoreRows = await query(
      "SELECT COALESCE(AVG(sub.score),0) as avg FROM submissions sub JOIN sessions s ON sub.session_id=s.id WHERE s.teacher_id=?",
      [tid]
    );

    const recentActivity = await query(
      `SELECT 'quiz_submission' as type,
        CONCAT(u.name, ' scored ', sub.score) as message,
        sub.submitted_at as timestamp
       FROM submissions sub
       JOIN users u ON sub.student_id=u.id
       JOIN sessions s ON sub.session_id=s.id
       WHERE s.teacher_id=?
       ORDER BY sub.submitted_at DESC LIMIT 8`,
      [tid]
    );

    const performanceDaily = await query(
      `SELECT DATE(sub.submitted_at) as date,
        COUNT(*) as quizzesTaken,
        ROUND(AVG(sub.score),1) as averageScore
       FROM submissions sub
       JOIN sessions s ON sub.session_id=s.id
       WHERE s.teacher_id=? AND sub.submitted_at IS NOT NULL
       GROUP BY DATE(sub.submitted_at)
       ORDER BY date DESC LIMIT 14`,
      [tid]
    );

    return sendSuccess(res, {
      totalQuizzes: qCountRows[0]?.cnt ?? 0,
      totalStudents: sCountRows[0]?.cnt ?? 0,
      activeQuizzes: activeRows[0]?.cnt ?? 0,
      averageScore: Math.round(Number(avgScoreRows[0]?.avg ?? 0)),
      recentActivity: recentActivity.map((a) => ({
        type: a.type,
        message: a.message,
        timestamp: a.timestamp,
      })),
      performanceData: {
        daily: performanceDaily.map((d) => ({
          date: d.date,
          quizzesTaken: d.quizzesTaken,
          averageScore: d.averageScore,
        })),
      },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Database error", 500);
  }
});

// GET /api/stats/quiz/:quizId
router.get("/quiz/:quizId", async (req, res) => {
  try {
    const quiz = await queryOne("SELECT * FROM quizzes WHERE id=? AND teacher_id=?", [
      req.params.quizId,
      req.user.id,
    ]);
    if (!quiz) return sendError(res, "BIZ_001", "Quiz not found", 404);

    const subs = await query(
      `SELECT sub.score, sub.submitted_at, u.name as studentName
       FROM submissions sub
       JOIN sessions s ON sub.session_id=s.id
       JOIN users u ON sub.student_id=u.id
       WHERE s.quiz_id=?`,
      [quiz.id]
    );

    const avg =
      subs.length === 0 ? 0 : subs.reduce((a, s) => a + s.score, 0) / subs.length;

    return sendSuccess(res, {
      quizId: quiz.id,
      title: quiz.title,
      attempts: subs.length,
      averageScore: Math.round(avg * 10) / 10,
      submissions: subs,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Database error", 500);
  }
});

// GET /api/stats/student/:studentId (teacher-only: students who joined this teacher's sessions)
router.get("/student/:studentId", async (req, res) => {
  try {
    const student = await queryOne("SELECT id, name, role FROM users WHERE id=? AND role='student'", [
      req.params.studentId,
    ]);
    if (!student) return sendError(res, "NOT_FOUND", "Student not found", 404);

    const participated = await queryOne(
      `SELECT COUNT(*) as cnt FROM session_students ss
       JOIN sessions s ON ss.session_id=s.id
       WHERE ss.student_id=? AND s.teacher_id=?`,
      [student.id, req.user.id]
    );
    if (!participated?.cnt) return sendError(res, "FORBIDDEN", "No data for this student", 403);

    const history = await query(
      `SELECT sub.score, sub.submitted_at, q.title as quizTitle
       FROM submissions sub
       JOIN sessions s ON sub.session_id=s.id
       JOIN quizzes q ON s.quiz_id=q.id
       WHERE sub.student_id=? AND s.teacher_id=?
       ORDER BY sub.submitted_at DESC LIMIT 20`,
      [student.id, req.user.id]
    );

    return sendSuccess(res, {
      student,
      attempts: history.length,
      history,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Database error", 500);
  }
});

// GET /api/stats/tournament/:tournamentId
router.get("/tournament/:tournamentId", async (req, res) => {
  try {
    const t = await queryOne("SELECT * FROM tournaments WHERE id=? AND teacher_id=?", [
      req.params.tournamentId,
      req.user.id,
    ]);
    if (!t) return sendError(res, "NOT_FOUND", "Tournament not found", 404);

    const rounds = typeof t.rounds === "string" ? JSON.parse(t.rounds) : t.rounds;
    const players = typeof t.players === "string" ? JSON.parse(t.players) : t.players;

    return sendSuccess(res, {
      id: t.id,
      name: t.name,
      status: t.status,
      currentRound: t.current_round,
      champion: t.champion,
      playerCount: Array.isArray(players) ? players.length : 0,
      totalRounds: Array.isArray(rounds) ? rounds.length : 0,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Database error", 500);
  }
});

module.exports = router;
