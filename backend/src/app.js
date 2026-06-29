const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const { router: quizRoutes } = require("./routes/quizRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const gameRoutes = require("./routes/gameRoutes");
const tournamentRoutes = require("./routes/tournamentRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const fileRoutes = require("./routes/fileRoutes");
const statsRoutes = require("./routes/statsRoutes");
const studentMgmtRoutes = require("./routes/studentMgmtRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json({ limit: "12mb" }));

function healthAt(base) {
  app.get(`${base}/health`, (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
}

function mountApi(base) {
  healthAt(base);
  app.use(`${base}/auth`, authRoutes);
  app.use(`${base}/quizzes`, quizRoutes);
  app.use(`${base}/sessions`, sessionRoutes);
  app.use(`${base}/teacher`, teacherRoutes);
  app.use(`${base}/games`, gameRoutes);
  app.use(`${base}/tournaments`, tournamentRoutes);
  app.use(`${base}/pdf`, pdfRoutes);
  app.use(`${base}/files`, fileRoutes);
  app.use(`${base}/stats`, statsRoutes);
  app.use(`${base}/students`, studentMgmtRoutes);
}

// Docs: /api — keep /api/v1 for backward compatibility
mountApi("/api");
mountApi("/api/v1");

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

module.exports = app;
