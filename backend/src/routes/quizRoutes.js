const express = require("express");
const { query, queryOne, generateId, generateUniqueJoinCode } = require("../db/helpers");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const {
  validateQuestionArrayStrict,
  optionIdForIndex,
  shuffleQuestionOptionsDeterministic,
} = require("../utils/questionValidation");

const router = express.Router();
router.use(requireAuth);

// Helper: get full quiz with questions
async function getQuizWithQuestions(quizId) {
  const quiz = await queryOne("SELECT * FROM quizzes WHERE id=?", [quizId]);
  if (!quiz) return null;
  const questions = await query(
    "SELECT * FROM questions WHERE quiz_id=? ORDER BY sort_order ASC",
    [quizId]
  );
  quiz.questions = questions.map((q, i) => ({
    id: q.id,
    text: q.question_text,
    question: q.question_text,
    options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
    optionIds: (typeof q.options === "string" ? JSON.parse(q.options) : q.options).map((_, idx) =>
      optionIdForIndex(idx)
    ),
    correctAnswerId: q.correct_answer_id || optionIdForIndex(q.correct_option_index || 0),
    correctOptionIndex: q.correct_option_index,
    correctAnswer: q.correct_option_index,
  }));
  return quiz;
}

function sanitizeQuizForTaking(quiz) {
  const copy = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    teacher_id: quiz.teacher_id,
    questions: (quiz.questions || []).map((q, idx) => ({
      ...shuffleQuestionOptionsDeterministic(
        {
          id: q.id ?? idx + 1,
          question: q.question || q.text,
          options: q.options,
          optionIds: Array.isArray(q.optionIds)
            ? q.optionIds
            : (q.options || []).map((_, optionIndex) => optionIdForIndex(optionIndex)),
          correctOptionIndex: q.correctOptionIndex ?? 0,
          correctAnswerId: q.correctAnswerId || optionIdForIndex(q.correctOptionIndex ?? 0),
          timeLimit: q.timeLimit,
        },
        `${Date.now()}-${Math.random()}-${idx}`
      ),
      id: q.id ?? idx + 1,
      question: q.question || q.text,
      timeLimit: q.timeLimit,
    })),
  };
  return copy;
}

// POST /api/quizzes/join — doc alias: joinCode + studentName (auth required)
router.post("/join", requireRole("student"), async (req, res) => {
  const joinCode = req.body.joinCode || req.body.code;
  if (!joinCode) return sendError(res, "VALID_001", "joinCode is required", 400);

  try {
    const session = await queryOne("SELECT * FROM sessions WHERE join_code=?", [String(joinCode)]);
    if (!session) return sendError(res, "BIZ_003", "Invalid join code", 404);
    if (session.status === "completed")
      return sendError(res, "BIZ_002", "Session already completed", 400);

    await query("INSERT IGNORE INTO session_students (session_id,student_id) VALUES (?,?)", [
      session.id,
      req.user.id,
    ]);
    await query("UPDATE sessions SET status='live' WHERE id=? AND status='waiting'", [session.id]);

    const quiz = await getQuizWithQuestions(session.quiz_id);
    const safeQuiz = sanitizeQuizForTaking(quiz);

    return sendSuccess(res, {
      sessionId: session.id,
      quiz: safeQuiz,
      student: {
        id: req.user.id,
        name: req.body.studentName || req.user.name,
      },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Server error", 500);
  }
});

// GET /api/quizzes/join/:joinCode — preview (no correct answers); optional auth
router.get("/join/:joinCode", optionalAuth, async (req, res) => {
  try {
    const session = await queryOne("SELECT * FROM sessions WHERE join_code=?", [
      String(req.params.joinCode),
    ]);
    if (!session) return sendError(res, "BIZ_003", "Invalid join code", 404);

    const quiz = await getQuizWithQuestions(session.quiz_id);
    return sendSuccess(res, {
      sessionId: session.id,
      status: session.status,
      quiz: sanitizeQuizForTaking(quiz),
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Server error", 500);
  }
});

// POST /api/quizzes
router.post("/", requireRole("teacher"), async (req, res) => {
  const { title, description = "", questions = [], settings } = req.body;
  if (!title || !Array.isArray(questions) || questions.length === 0)
    return res.status(400).json({ message: "title and at least one question are required" });

  try {
    const normalizedQuestions = validateQuestionArrayStrict(questions);
    const quizId = generateId("quiz");
    const settingsJson = settings ? JSON.stringify(settings) : null;
    try {
      await query(
        "INSERT INTO quizzes (id,teacher_id,title,description,settings_json,status) VALUES (?,?,?,?,?,'draft')",
        [quizId, req.user.id, title, description, settingsJson]
      );
    } catch (e) {
      if (!String(e.message).includes("Unknown column")) throw e;
      await query("INSERT INTO quizzes (id,teacher_id,title,description) VALUES (?,?,?,?)", [
        quizId,
        req.user.id,
        title,
        description,
      ]);
    }
    for (let i = 0; i < normalizedQuestions.length; i++) {
      const q = normalizedQuestions[i];
      const correctIdx = q.correctOptionIndex;
      const correctAnswerId = q.correctAnswerId || optionIdForIndex(correctIdx);
      try {
        await query(
          "INSERT INTO questions (id,quiz_id,question_text,options,correct_option_index,correct_answer_id,sort_order) VALUES (?,?,?,?,?,?,?)",
          [generateId("q"), quizId, q.question, JSON.stringify(q.options), correctIdx, correctAnswerId, i]
        );
      } catch (insertError) {
        if (!String(insertError?.message || "").includes("Unknown column")) throw insertError;
        await query(
          "INSERT INTO questions (id,quiz_id,question_text,options,correct_option_index,sort_order) VALUES (?,?,?,?,?,?)",
          [generateId("q"), quizId, q.question, JSON.stringify(q.options), correctIdx, i]
        );
      }
    }
    const quiz = await getQuizWithQuestions(quizId);
    return res.status(201).json({ quiz });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/quizzes — pagination + filters (teacher)
router.get("/", requireRole("teacher"), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;

    let where = "teacher_id=?";
    const params = [req.user.id];
    if (search) {
      where += " AND (title LIKE ? OR description LIKE ?)";
      params.push(search, search);
    }

    const rows = await query(
      `SELECT q.*,
        (SELECT COUNT(*) FROM questions qs WHERE qs.quiz_id=q.id) as questions_count,
        (SELECT COUNT(DISTINCT ss.student_id) FROM sessions s
          JOIN session_students ss ON s.id=ss.session_id WHERE s.quiz_id=q.id) as participants_count
       FROM quizzes q WHERE ${where} ORDER BY q.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const totalRow = await queryOne(`SELECT COUNT(*) as c FROM quizzes WHERE ${where}`, params);
    const total = totalRow?.c ?? 0;

    const quizzes = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status || "draft",
      joinCode: r.join_code || null,
      questionsCount: r.questions_count,
      participantsCount: r.participants_count,
      createdAt: r.created_at,
    }));

    return res.json({
      quizzes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/quizzes/:quizId/publish — create waiting session, return join code
router.post("/:quizId/publish", requireRole("teacher"), async (req, res) => {
  try {
    const quiz = await queryOne("SELECT * FROM quizzes WHERE id=?", [req.params.quizId]);
    if (!quiz) return sendError(res, "BIZ_001", "Quiz not found", 404);
    if (quiz.teacher_id !== req.user.id) return sendError(res, "FORBIDDEN", "Forbidden", 403);

    const id = generateId("session");
    const joinCode = await generateUniqueJoinCode();
    await query(
      "INSERT INTO sessions (id,quiz_id,teacher_id,join_code,status) VALUES (?,?,?,?,?)",
      [id, quiz.id, req.user.id, joinCode, "waiting"]
    );

    try {
      await query("UPDATE quizzes SET status='active', join_code=? WHERE id=?", [joinCode, quiz.id]);
    } catch (e) {
      if (!String(e.message).includes("Unknown column")) throw e;
    }

    return sendSuccess(
      res,
      {
        joinCode,
        publishedAt: new Date().toISOString(),
        sessionId: id,
      },
      "Quiz published",
      200
    );
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Server error", 500);
  }
});

// GET /api/quizzes/:quizId/results (teacher) — before /:quizId
router.get("/:quizId/results", requireRole("teacher"), async (req, res) => {
  try {
    const quiz = await queryOne("SELECT * FROM quizzes WHERE id=?", [req.params.quizId]);
    if (!quiz || quiz.teacher_id !== req.user.id)
      return sendError(res, "BIZ_001", "Quiz not found", 404);

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const rows = await query(
      `SELECT u.name as studentName, sub.score, sub.submitted_at as submittedAt, u.id as studentId
       FROM submissions sub
       JOIN sessions s ON sub.session_id=s.id
       JOIN users u ON sub.student_id=u.id
       WHERE s.quiz_id=?
       ORDER BY sub.score DESC, sub.submitted_at ASC
       LIMIT ? OFFSET ?`,
      [quiz.id, limit, offset]
    );

    const totalRow = await queryOne(
      `SELECT COUNT(*) as c FROM submissions sub
       JOIN sessions s ON sub.session_id=s.id WHERE s.quiz_id=?`,
      [quiz.id]
    );

    return sendSuccess(res, {
      results: rows,
      pagination: {
        page,
        limit,
        total: totalRow?.c ?? 0,
        pages: Math.ceil((totalRow?.c ?? 0) / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Server error", 500);
  }
});

// GET /api/quizzes/:quizId/leaderboard
router.get("/:quizId/leaderboard", async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const quiz = await queryOne("SELECT id FROM quizzes WHERE id=?", [req.params.quizId]);
    if (!quiz) return sendError(res, "BIZ_001", "Quiz not found", 404);

    const rows = await query(
      `SELECT u.id as studentId, u.name as studentName, sub.score, sub.submitted_at as completedAt
       FROM submissions sub
       JOIN sessions s ON sub.session_id=s.id
       JOIN users u ON sub.student_id=u.id
       WHERE s.quiz_id=?
       ORDER BY sub.score DESC, sub.submitted_at ASC
       LIMIT ?`,
      [req.params.quizId, limit]
    );

    const leaderboard = rows.map((r, i) => ({
      rank: i + 1,
      studentId: r.studentId,
      studentName: r.studentName,
      score: r.score,
      timeSpent: 0,
      completedAt: r.completedAt,
    }));

    return sendSuccess(res, { leaderboard });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Server error", 500);
  }
});

// GET /api/quizzes/:quizId
router.get("/:quizId", requireRole("teacher", "student"), async (req, res) => {
  try {
    const quiz = await getQuizWithQuestions(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (req.user.role === "teacher" && quiz.teacher_id !== req.user.id)
      return res.status(403).json({ message: "Cannot access another teacher's quiz" });

    if (req.user.role === "student") {
      const member = await queryOne(
        `SELECT 1 FROM session_students ss
         JOIN sessions s ON ss.session_id=s.id
         WHERE s.quiz_id=? AND ss.student_id=?`,
        [quiz.id, req.user.id]
      );
      if (!member) return res.status(403).json({ message: "Join a session for this quiz first" });
      return res.json({ quiz: sanitizeQuizForTaking(quiz) });
    }

    return res.json({ quiz });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/quizzes/:quizId
router.put("/:quizId", requireRole("teacher"), async (req, res) => {
  try {
    const quiz = await queryOne("SELECT * FROM quizzes WHERE id=?", [req.params.quizId]);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (quiz.teacher_id !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    const { title, description, questions, settings } = req.body;
    if (title || description !== undefined) {
      await query("UPDATE quizzes SET title=COALESCE(?,title), description=COALESCE(?,description) WHERE id=?", [
        title || null,
        description !== undefined ? description : null,
        quiz.id,
      ]);
    }
    if (settings !== undefined) {
      await query("UPDATE quizzes SET settings_json=? WHERE id=?", [
        JSON.stringify(settings),
        quiz.id,
      ]);
    }
    if (Array.isArray(questions) && questions.length > 0) {
      const normalizedQuestions = validateQuestionArrayStrict(questions);
      await query("DELETE FROM questions WHERE quiz_id=?", [quiz.id]);
      for (let i = 0; i < normalizedQuestions.length; i++) {
        const q = normalizedQuestions[i];
        const correctIdx = q.correctOptionIndex;
        const correctAnswerId = q.correctAnswerId || optionIdForIndex(correctIdx);
        try {
          await query(
            "INSERT INTO questions (id,quiz_id,question_text,options,correct_option_index,correct_answer_id,sort_order) VALUES (?,?,?,?,?,?,?)",
            [generateId("q"), quiz.id, q.question, JSON.stringify(q.options), correctIdx, correctAnswerId, i]
          );
        } catch (insertError) {
          if (!String(insertError?.message || "").includes("Unknown column")) throw insertError;
          await query(
            "INSERT INTO questions (id,quiz_id,question_text,options,correct_option_index,sort_order) VALUES (?,?,?,?,?,?)",
            [generateId("q"), quiz.id, q.question, JSON.stringify(q.options), correctIdx, i]
          );
        }
      }
    }
    const updated = await getQuizWithQuestions(quiz.id);
    return res.json({ quiz: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/quizzes/:quizId
router.delete("/:quizId", requireRole("teacher"), async (req, res) => {
  try {
    const quiz = await queryOne("SELECT * FROM quizzes WHERE id=?", [req.params.quizId]);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    if (quiz.teacher_id !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    await query("DELETE FROM quizzes WHERE id=?", [quiz.id]);
    return res.json({ deleted: quiz });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/quizzes/:quizId/submit — doc-style submit using sessionId in body
router.post("/:quizId/submit", requireRole("student"), async (req, res) => {
  const { sessionId, answers, completedAt: _completedAt } = req.body;
  if (!sessionId || !Array.isArray(answers))
    return sendError(res, "VALID_001", "sessionId and answers are required", 400);

  try {
    const session = await queryOne("SELECT * FROM sessions WHERE id=? AND quiz_id=?", [
      sessionId,
      req.params.quizId,
    ]);
    if (!session) return sendError(res, "BIZ_001", "Session not found", 404);

    const member = await queryOne(
      "SELECT 1 FROM session_students WHERE session_id=? AND student_id=?",
      [session.id, req.user.id]
    );
    if (!member) return sendError(res, "FORBIDDEN", "Join the session first", 403);
    if (session.status !== "live")
      return sendError(res, "BIZ_002", "Session is not live", 400);

    const questions = await query("SELECT * FROM questions WHERE quiz_id=? ORDER BY sort_order", [
      session.quiz_id,
    ]);

    let correctAnswers = 0;
    const results = [];
    for (const ans of answers) {
      let qrow;
      if (ans.questionIndex !== undefined && ans.questionIndex !== null) {
        qrow = questions[ans.questionIndex];
      } else if (ans.questionId) {
        qrow = questions.find((x) => x.id === ans.questionId);
      }
      if (!qrow) continue;
      const sel = ans.selectedAnswer ?? ans.selectedOptionIndex;
      const selectedAnswerId = String(ans.selectedAnswerId || "").trim();
      const correctAnswerId =
        qrow.correct_answer_id || optionIdForIndex(Number(qrow.correct_option_index || 0));
      const ok =
        (selectedAnswerId && selectedAnswerId === correctAnswerId) ||
        Number(sel) === Number(qrow.correct_option_index);
      if (ok) correctAnswers++;
      results.push({
        questionId: qrow.sort_order,
        correct: ok,
        selectedAnswer: sel,
        selectedAnswerId: selectedAnswerId || null,
        correctAnswerId,
        correctAnswer: qrow.correct_option_index,
      });
    }

    const score = correctAnswers;
    const totalQuestions = questions.length;

    const subId = generateId("sub");
    await query(
      `INSERT INTO submissions (id,session_id,student_id,answers,score) VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE answers=VALUES(answers),score=VALUES(score),submitted_at=NOW()`,
      [subId, session.id, req.user.id, JSON.stringify(answers), score]
    );

    const rankRow = await query(
      `SELECT COUNT(*) + 1 as rnk FROM submissions WHERE session_id=? AND score > ?`,
      [session.id, score]
    );

    return sendSuccess(res, {
      score,
      totalQuestions,
      correctAnswers,
      timeSpent: 0,
      rank: rankRow[0]?.rnk ?? 1,
      results,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, "SYS_001", "Server error", 500);
  }
});

module.exports = { router, getQuizWithQuestions, sanitizeQuizForTaking };
