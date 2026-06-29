const express = require("express");
const { query, queryOne, generateId } = require("../db/helpers");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/v1/tournaments
router.get("/", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM tournaments WHERE teacher_id=? ORDER BY created_at DESC", [req.user.id]);
    const tournaments = rows.map(t => ({
      ...t,
      players: typeof t.players === "string" ? JSON.parse(t.players) : t.players,
      rounds:  typeof t.rounds  === "string" ? JSON.parse(t.rounds)  : t.rounds,
    }));
    return res.json({ tournaments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/v1/tournaments
router.post("/", requireRole("teacher"), async (req, res) => {
  const { name, description, players } = req.body;
  if (!name || !Array.isArray(players) || players.length < 2)
    return res.status(400).json({ message: "name and at least 2 players required" });

  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const rounds = [];
  let currentPlayers = shuffled;
  let roundNum = 1;

  while (currentPlayers.length > 1) {
    const matches = [];
    for (let i = 0; i < currentPlayers.length; i += 2) {
      if (i + 1 < currentPlayers.length) {
        matches.push({ id: generateId("match"), player1: currentPlayers[i], player2: currentPlayers[i + 1], winner: null, score: null, status: roundNum === 1 ? "pending" : "waiting" });
      } else {
        matches.push({ id: generateId("match"), player1: currentPlayers[i], player2: null, winner: currentPlayers[i], score: "BYE", status: "completed" });
      }
    }
    rounds.push({ round: roundNum, matches, status: roundNum === 1 ? "active" : "waiting" });
    currentPlayers = matches.map(m => m.winner || "TBD");
    roundNum++;
  }

  try {
    const id = generateId("tourn");
    await query(
      "INSERT INTO tournaments (id,teacher_id,name,description,players,rounds,status,current_round) VALUES (?,?,?,?,?,?,?,?)",
      [id, req.user.id, name, description || "", JSON.stringify(players), JSON.stringify(rounds), "active", 1]
    );
    const tournament = { id, teacherId: req.user.id, name, players, rounds, status: "active", currentRound: 1 };
    return res.status(201).json({ tournament });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/tournaments/:id/bracket (API spec) — register before /:id
router.get("/:id/bracket", async (req, res) => {
  try {
    const t = await queryOne("SELECT * FROM tournaments WHERE id=?", [req.params.id]);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    const rounds = typeof t.rounds === "string" ? JSON.parse(t.rounds) : t.rounds;
    return res.json({
      success: true,
      data: {
        tournament: {
          id: t.id,
          name: t.name,
          status: t.status,
          currentRound: t.current_round,
        },
        rounds,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/tournaments/:id
router.get("/:id", async (req, res) => {
  try {
    const t = await queryOne("SELECT * FROM tournaments WHERE id=?", [req.params.id]);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    t.players = typeof t.players === "string" ? JSON.parse(t.players) : t.players;
    t.rounds  = typeof t.rounds  === "string" ? JSON.parse(t.rounds)  : t.rounds;
    return res.json({ tournament: t });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT/POST /api/tournaments/:id/match/:matchId
async function updateMatchResult(req, res) {
  try {
    const t = await queryOne("SELECT * FROM tournaments WHERE id=?", [req.params.id]);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    if (t.teacher_id !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    t.rounds = typeof t.rounds === "string" ? JSON.parse(t.rounds) : t.rounds;
    const { winner } = req.body;
    let matchFound = false;

    for (const round of t.rounds) {
      const match = round.matches.find(m => m.id === req.params.matchId);
      if (match) {
        match.winner = winner; match.status = "completed";
        matchFound = true;
        const allDone = round.matches.every(m => m.status === "completed");
        if (allDone) {
          round.status = "completed";
          const winners = round.matches.map(m => m.winner).filter(Boolean);
          const nextRound = t.rounds.find(r => r.round === round.round + 1);
          if (nextRound) {
            nextRound.status = "active";
            nextRound.matches.forEach((nm, i) => {
              if (winners[i * 2] !== undefined) nm.player1 = winners[i * 2];
              if (winners[i * 2 + 1] !== undefined) nm.player2 = winners[i * 2 + 1];
              nm.status = "pending";
            });
            t.current_round = nextRound.round;
          } else {
            t.status = "completed"; t.champion = winner;
          }
        }
        break;
      }
    }

    if (!matchFound) return res.status(404).json({ message: "Match not found" });

    await query(
      "UPDATE tournaments SET rounds=?, status=?, current_round=?, champion=? WHERE id=?",
      [JSON.stringify(t.rounds), t.status, t.current_round, t.champion || null, t.id]
    );
    t.players = typeof t.players === "string" ? JSON.parse(t.players) : t.players;
    return res.json({ tournament: t });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

router.put("/:id/match/:matchId", requireRole("teacher"), updateMatchResult);
router.post("/:id/match/:matchId", requireRole("teacher"), updateMatchResult);

// DELETE /api/tournaments/:id
router.delete("/:id", requireRole("teacher"), async (req, res) => {
  try {
    const t = await queryOne("SELECT * FROM tournaments WHERE id=?", [req.params.id]);
    if (!t) return res.status(404).json({ message: "Tournament not found" });
    if (t.teacher_id !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    await query("DELETE FROM tournaments WHERE id=?", [t.id]);
    return res.json({ deleted: t });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
