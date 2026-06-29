const jwt = require("jsonwebtoken");

function attachQuizSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      socket.user = null;
      return next();
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: payload.sub, name: payload.name, role: payload.role };
      next();
    } catch (_e) {
      socket.user = null;
      next();
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-quiz", ({ sessionId }) => {
      if (!sessionId) return;
      const room = `quiz:${sessionId}`;
      socket.join(room);
      const size = io.sockets.adapter.rooms.get(room)?.size ?? 1;
      socket.emit("quiz-joined", { sessionId, participants: size });
    });

    socket.on("submit-answer", (payload) => {
      if (!payload?.sessionId) return;
      socket.to(`quiz:${payload.sessionId}`).emit("leaderboard-update", {
        leaderboard: payload.leaderboard || [],
      });
    });

    socket.on("tournament-subscribe", ({ tournamentId }) => {
      if (!tournamentId) return;
      socket.join(`tournament:${tournamentId}`);
    });
  });
}

module.exports = { attachQuizSockets };
