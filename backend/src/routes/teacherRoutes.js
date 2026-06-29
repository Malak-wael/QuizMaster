const express = require("express");
const { query, queryOne } = require("../db/helpers");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);
router.use(requireRole("teacher"));

// GET /api/v1/teacher/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const tid = req.user.id;

    const qCountRows   = await query("SELECT COUNT(*) as cnt FROM quizzes WHERE teacher_id=?", [tid]);
    const sCountRows   = await query("SELECT COUNT(DISTINCT ss.student_id) as cnt FROM sessions s JOIN session_students ss ON s.id=ss.session_id WHERE s.teacher_id=?", [tid]);
    const activeRows   = await query("SELECT COUNT(*) as cnt FROM sessions WHERE teacher_id=? AND status IN ('waiting','live')", [tid]);
    const avgScoreRows = await query("SELECT COALESCE(AVG(sub.score),0) as avg FROM submissions sub JOIN sessions s ON sub.session_id=s.id WHERE s.teacher_id=?", [tid]);
    const qCount   = qCountRows[0]   || { cnt: 0 };
    const sCount   = sCountRows[0]   || { cnt: 0 };
    const active   = activeRows[0]   || { cnt: 0 };
    const avgScore = avgScoreRows[0] || { avg: 0 };

    const stats = [
      { label: "Total Quizzes",   value: qCount.cnt },
      { label: "Total Students",  value: sCount.cnt },
      { label: "Active Sessions", value: active.cnt },
      { label: "Average Score",   value: Math.round(avgScore.avg) },
    ];

    const recentQuizzes = await query(
      "SELECT q.id, q.title, COUNT(qs.id) as questions_count FROM quizzes q LEFT JOIN questions qs ON q.id=qs.quiz_id WHERE q.teacher_id=? GROUP BY q.id ORDER BY q.created_at DESC LIMIT 5",
      [tid]
    );

    const recentActivity = await query(
      "SELECT sub.id, u.name as studentName, sub.score, sub.submitted_at FROM submissions sub JOIN users u ON sub.student_id=u.id JOIN sessions s ON sub.session_id=s.id WHERE s.teacher_id=? ORDER BY sub.submitted_at DESC LIMIT 5",
      [tid]
    );

    const activity = recentActivity.map(a => ({
      id: a.id,
      message: `${a.studentName} submitted with score ${a.score}`,
    }));

    return res.json({ stats, recentQuizzes, recentActivity: activity });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
