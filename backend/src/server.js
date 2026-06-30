require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { testConnection } = require("./db/connection");
const { attachQuizSockets } = require("./sockets/quizSocket");

const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error("❌ Missing JWT_SECRET in environment variables.");
  process.exit(1);
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

attachQuizSockets(io);

async function start() {
  await testConnection();
  server.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api`);
    console.log(`   Database: ${process.env.DB_NAME || "quizmaster"} @ ${process.env.DB_HOST || "localhost"}`);
    console.log(`   WebSocket: ws://localhost:${PORT}`);
  });
}

start();
module.exports = app;
