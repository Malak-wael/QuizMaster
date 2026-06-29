const express = require("express");
const { query, queryOne, generateId, generateUniqueGamePin, normalizeGamePin } = require("../db/helpers");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// ── helpers ──────────────────────────────────────────────
async function getGame(pin) {
  const row = await queryOne("SELECT * FROM game_sessions WHERE pin=?", [pin]);
  if (!row) return null;
  row.state = typeof row.state === "string" ? JSON.parse(row.state) : row.state;
  return row;
}

async function saveGame(pin, state, status) {
  await query("UPDATE game_sessions SET state=?, status=? WHERE pin=?", [JSON.stringify(state), status, pin]);
}

async function getQuizQuestions(quizId) {
  const rows = await query("SELECT * FROM questions WHERE quiz_id=? ORDER BY sort_order", [quizId]);
  return rows.map(q => ({
    id: q.id, text: q.question_text, question: q.question_text,
    options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
    correctOptionIndex: q.correct_option_index, correctAnswer: q.correct_option_index,
  }));
}

async function findTeacherQuiz(teacherId) {
  return queryOne("SELECT id FROM quizzes WHERE teacher_id=? ORDER BY created_at DESC LIMIT 1", [teacherId]);
}

// ══════════════════════════════════════
//  TEAM RACE
// ══════════════════════════════════════

router.post("/race/create", requireAuth, requireRole("teacher"), async (req, res) => {
  const { teams, quizId } = req.body;
  if (!Array.isArray(teams) || teams.length < 2)
    return res.status(400).json({ message: "At least 2 teams required" });

  try {
    const quiz = quizId
      ? await queryOne("SELECT id FROM quizzes WHERE id=?", [quizId])
      : await findTeacherQuiz(req.user.id);
    if (!quiz) return res.status(404).json({ message: "No quiz found. Create a quiz first." });

    const questions = await getQuizQuestions(quiz.id);
    const pin = await generateUniqueGamePin();
    const state = {
      questions, currentQuestionIndex: 0,
      teams: teams.map(t => ({ id: generateId("team"), name: t.name, code: t.code || Math.floor(1000 + Math.random() * 9000).toString(), color: t.color || "blue", score: 0, players: [] })),
      winner: null,
    };
    await query("INSERT INTO game_sessions (id,pin,type,teacher_id,quiz_id,state,status) VALUES (?,?,?,?,?,?,?)",
      [generateId("gs"), pin, "race", req.user.id, quiz.id, JSON.stringify(state), "waiting"]);
    return res.status(201).json({ pin, game: { pin, status: "waiting", ...state } });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Server error" }); }
});

router.post("/race/join", requireAuth, requireRole("student"), async (req, res) => {
  const normalizedPin = normalizeGamePin(req.body.pin);
  const teamCodeRaw = req.body.teamCode != null ? String(req.body.teamCode).trim() : "";
  if (!normalizedPin || !teamCodeRaw) return res.status(400).json({ message: "pin and teamCode required" });
  try {
    const game = await getGame(normalizedPin);
    if (!game) return res.status(404).json({ message: "Race game not found" });
    if (game.status === "finished") return res.status(400).json({ message: "Game finished" });
    const team = game.state.teams.find(t => String(t.code).trim() === teamCodeRaw);
    if (!team) return res.status(404).json({ message: "Invalid team code" });
    if (!team.players.some(p => p.id === req.user.id))
      team.players.push({ id: req.user.id, name: req.user.name });
    await saveGame(normalizedPin, game.state, game.status);
    return res.json({ pin: normalizedPin, team: { id: team.id, name: team.name, color: team.color, code: team.code }, questions: game.state.questions });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Server error" }); }
});

router.post("/race/answer", requireAuth, requireRole("student"), async (req, res) => {
  const normalizedPin = normalizeGamePin(req.body.pin);
  const teamCodeRaw = req.body.teamCode != null ? String(req.body.teamCode).trim() : "";
  const { questionIndex, selectedOptionIndex } = req.body;
  try {
    if (!normalizedPin || !teamCodeRaw) return res.status(400).json({ message: "pin and teamCode required" });
    const game = await getGame(normalizedPin);
    if (!game) return res.status(404).json({ message: "Race game not found" });
    if (game.status === "finished") return res.status(400).json({ message: "Game finished" });
    const team = game.state.teams.find(t => String(t.code).trim() === teamCodeRaw);
    if (!team) return res.status(404).json({ message: "Team not found" });
    const question = game.state.questions[questionIndex];
    if (!question) return res.status(400).json({ message: "Question not found" });
    const correctIdx = question.correctOptionIndex ?? question.correctAnswer;
    const isCorrect = Number(selectedOptionIndex) === Number(correctIdx);
    if (isCorrect) team.score += 1;
    const winner = game.state.teams.find(t => t.score >= 10);
    if (winner) { game.state.winner = winner; game.status = "finished"; }
    await saveGame(normalizedPin, game.state, game.status);
    return res.json({ correct: isCorrect, teamScore: team.score, gameStatus: game.status, winner: game.state.winner || null, teams: (game.state.teams || []).map(t => ({ id: t.id, name: t.name, color: t.color, score: t.score })) });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Server error" }); }
});

router.post("/race/next", requireAuth, requireRole("teacher"), async (req, res) => {
  const normalizedPin = normalizeGamePin(req.body.pin);
  try {
    if (!normalizedPin) return res.status(400).json({ message: "Invalid game PIN" });
    const game = await getGame(normalizedPin);
    if (!game) return res.status(404).json({ message: "Race game not found" });
    if (game.state.currentQuestionIndex < game.state.questions.length - 1) game.state.currentQuestionIndex += 1;
    const newStatus = game.status === "waiting" ? "active" : game.status;
    await saveGame(normalizedPin, game.state, newStatus);
    return res.json({ currentQuestionIndex: game.state.currentQuestionIndex, status: newStatus });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Server error" }); }
});

router.get("/race/state/:pin", requireAuth, async (req, res) => {
  try {
    const normalizedPin = normalizeGamePin(req.params.pin);
    if (!normalizedPin) return res.status(400).json({ message: "Invalid game PIN" });
    const game = await getGame(normalizedPin);
    if (!game) return res.status(404).json({ message: "Race game not found" });
    const s = game.state;
    return res.json({ pin: game.pin, status: game.status, currentQuestionIndex: s.currentQuestionIndex, teams: s.teams.map(t => ({ id: t.id, name: t.name, color: t.color, code: t.code, score: t.score, playerCount: t.players.length })), question: s.questions[s.currentQuestionIndex] || null, totalQuestions: s.questions.length, winner: s.winner || null });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Server error" }); }
});

// ══════════════════════════════════════
//  BOSS BATTLE
// ══════════════════════════════════════

router.post("/boss/create", requireAuth, requireRole("teacher"), async (req, res) => {
  const { boss, teams, quizId } = req.body;
  if (!boss || !Array.isArray(teams) || teams.length < 1)
    return res.status(400).json({ message: "boss and at least 1 team required" });
  try {
    const quiz = quizId ? await queryOne("SELECT id FROM quizzes WHERE id=?", [quizId]) : await findTeacherQuiz(req.user.id);
    if (!quiz) return res.status(404).json({ message: "No quiz found. Create a quiz first." });
    const questions = await getQuizQuestions(quiz.id);
    const pin = await generateUniqueGamePin();
    const bossHp = boss.hp || 1000;
    const state = {
      questions, currentQuestionIndex: 0,
      boss: { name: boss.name || "Dark Dragon", emoji: boss.emoji || "🐉", hp: bossHp, currentHp: bossHp, damagePerHit: Math.floor(bossHp / Math.max(questions.length, 1)) },
      teams: teams.map(t => ({ id: generateId("team"), name: t.name, code: t.code || Math.floor(1000 + Math.random() * 9000).toString(), color: t.color || "blue", score: 0, damage: 0, hp: 100, maxHp: 100, players: [] })),
    };
    await query("INSERT INTO game_sessions (id,pin,type,teacher_id,quiz_id,state,status) VALUES (?,?,?,?,?,?,?)",
      [generateId("gs"), pin, "boss", req.user.id, quiz.id, JSON.stringify(state), "active"]);
    return res.status(201).json({ pin, game: { pin, status: "active", ...state } });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Server error" }); }
});

router.post("/boss/join", requireAuth, requireRole("student"), async (req, res) => {
  const normalizedPin = normalizeGamePin(req.body.pin);
  const teamCodeRaw = req.body.teamCode != null ? String(req.body.teamCode).trim() : "";
  try {
    if (!normalizedPin || !teamCodeRaw) return res.status(400).json({ message: "pin and teamCode required" });
    const game = await getGame(normalizedPin);
    if (!game) return res.status(404).json({ message: "Boss game not found" });
    const team = game.state.teams.find(t => String(t.code).trim() === teamCodeRaw);
    if (!team) return res.status(404).json({ message: "Invalid team code" });
    if (!team.players.some(p => p.id === req.user.id)) team.players.push({ id: req.user.id, name: req.user.name });
    await saveGame(normalizedPin, game.state, game.status);
    const bossData = game.state.boss || {};
    return res.json({ pin: normalizedPin, team: { id: team.id, name: team.name, color: team.color, code: team.code, hp: team.hp, maxHp: team.maxHp }, boss: { name: bossData.name, emoji: bossData.emoji, hp: bossData.hp, currentHp: bossData.currentHp }, questions: game.state.questions || [] });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Server error" }); }
});

router.post("/boss/attack", requireAuth, requireRole("student"), async (req, res) => {
  const normalizedPin = normalizeGamePin(req.body.pin);
  const teamCodeRaw = req.body.teamCode != null ? String(req.body.teamCode).trim() : "";
  const { questionIndex, selectedOptionIndex } = req.body;
  try {
    if (!normalizedPin || !teamCodeRaw) return res.status(400).json({ message: "pin and teamCode required" });
    const game = await getGame(normalizedPin);
    if (!game) return res.status(404).json({ message: "Boss game not found" });
    if (game.status !== "active") return res.status(400).json({ message: `Game is ${game.status}` });
    const team = game.state.teams.find(t => String(t.code).trim() === teamCodeRaw);
    if (!team) return res.status(404).json({ message: "Team not found" });
    const question = game.state.questions[questionIndex];
    if (!question) return res.status(400).json({ message: "Question not found" });
    const correctIdx = question.correctOptionIndex ?? question.correctAnswer;
    const isCorrect = Number(selectedOptionIndex) === Number(correctIdx);
    if (isCorrect) {
      game.state.boss.currentHp = Math.max(0, game.state.boss.currentHp - game.state.boss.damagePerHit);
      team.score += 1; team.damage += game.state.boss.damagePerHit;
      if (game.state.boss.currentHp === 0) game.status = "victory";
    } else {
      team.hp = Math.max(0, team.hp - 10);
      if (game.state.teams.every(t => t.hp === 0)) game.status = "defeat";
    }
    await saveGame(normalizedPin, game.state, game.status);
    return res.json({ correct: isCorrect, gameStatus: game.status, boss: game.state.boss, teams: (game.state.teams || []).map(t => ({ id: t.id, name: t.name, color: t.color, score: t.score, damage: t.damage, hp: t.hp, maxHp: t.maxHp })) });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Server error" }); }
});

router.get("/boss/state/:pin", requireAuth, async (req, res) => {
  try {
    const normalizedPin = normalizeGamePin(req.params.pin);
    if (!normalizedPin) return res.status(400).json({ message: "Invalid game PIN" });
    const game = await getGame(normalizedPin);
    if (!game) return res.status(404).json({ message: "Boss game not found" });
    const s = game.state;
    const mvp = [...s.teams].sort((a, b) => b.damage - a.damage)[0];
    return res.json({ pin: game.pin, status: game.status, boss: s.boss, teams: s.teams.map(t => ({ id: t.id, name: t.name, color: t.color, code: t.code, score: t.score, damage: t.damage, hp: t.hp, maxHp: t.maxHp, playerCount: t.players.length })), currentQuestion: s.questions[s.currentQuestionIndex] || null, totalQuestions: s.questions.length, mvp: mvp ? { name: mvp.name, damage: mvp.damage } : null });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Server error" }); }
});

// ══════════════════════════════════════
//  BATTLE (1v1)
// ══════════════════════════════════════

router.post("/battle/start", requireAuth, requireRole("teacher"), async (req, res) => {
  const { player1Name, player2Name, quizId } = req.body;
  if (!player1Name || !player2Name) return res.status(400).json({ message: "player1Name and player2Name required" });
  try {
    const quiz = quizId ? await queryOne("SELECT id FROM quizzes WHERE id=?", [quizId]) : await findTeacherQuiz(req.user.id);
    if (!quiz) return res.status(404).json({ message: "No quiz found. Create a quiz first." });
    const questions = await getQuizQuestions(quiz.id);
    const pin = await generateUniqueGamePin();
    const state = { questions, currentQuestionIndex: 0, players: { p1: { name: player1Name, score: 0, status: "waiting" }, p2: { name: player2Name, score: 0, status: "waiting" } } };
    await query("INSERT INTO game_sessions (id,pin,type,teacher_id,quiz_id,state,status) VALUES (?,?,?,?,?,?,?)",
      [generateId("gs"), pin, "battle", req.user.id, quiz.id, JSON.stringify(state), "playing"]);
    return res.status(201).json({ pin, game: { pin, status: "playing", ...state } });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Server error" }); }
});

router.post("/battle/action", requireAuth, requireRole("teacher"), async (req, res) => {
  const normalizedPin = normalizeGamePin(req.body.pin);
  const { player, selectedOptionIndex } = req.body;
  try {
    if (!normalizedPin) return res.status(400).json({ message: "Invalid game PIN" });
    const game = await getGame(normalizedPin);
    if (!game) return res.status(404).json({ message: "Battle not found" });
    if (game.status !== "playing") return res.status(400).json({ message: "Game is not playing" });
    if (!["p1", "p2"].includes(player)) return res.status(400).json({ message: "player must be p1 or p2" });
    const pState = game.state.players[player];
    if (pState.status !== "waiting") return res.json({ message: "Already answered", game: { ...game.state, status: game.status, pin: normalizedPin } });
    const question = game.state.questions[game.state.currentQuestionIndex];
    if (!question) return res.status(400).json({ message: "No current question" });
    const correctIdx = question.correctOptionIndex ?? question.correctAnswer;
    const isCorrect = Number(selectedOptionIndex) === Number(correctIdx);
    pState.status = isCorrect ? "correct" : "wrong";
    if (isCorrect) pState.score += 1;
    const { p1, p2 } = game.state.players;
    const shouldAdvance = p1.status === "correct" || p2.status === "correct" || (p1.status === "wrong" && p2.status === "wrong");
    let newStatus = game.status;
    if (shouldAdvance) {
      if (game.state.currentQuestionIndex < game.state.questions.length - 1) {
        setTimeout(async () => {
          game.state.currentQuestionIndex += 1;
          game.state.players.p1.status = "waiting";
          game.state.players.p2.status = "waiting";
          await saveGame(normalizedPin, game.state, "playing");
        }, 1500);
      } else {
        newStatus = "gameover";
        setTimeout(async () => { await saveGame(normalizedPin, game.state, "gameover"); }, 1500);
      }
    }
    await saveGame(normalizedPin, game.state, newStatus);
    return res.json({ correct: isCorrect, game: { pin: normalizedPin, status: newStatus, ...game.state } });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Server error" }); }
});

router.get("/battle/state/:pin", requireAuth, async (req, res) => {
  try {
    const normalizedPin = normalizeGamePin(req.params.pin);
    if (!normalizedPin) return res.status(400).json({ message: "Invalid game PIN" });
    const game = await getGame(normalizedPin);
    if (!game) return res.status(404).json({ message: "Battle not found" });
    const s = game.state;
    return res.json({ pin: game.pin, status: game.status, currentQuestionIndex: s.currentQuestionIndex, question: s.questions[s.currentQuestionIndex] || null, totalQuestions: s.questions.length, players: s.players });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Server error" }); }
});

module.exports = router;
