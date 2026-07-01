const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({ limit: "12mb" }));

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
