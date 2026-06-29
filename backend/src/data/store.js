const bcrypt = require("bcryptjs");

const users = [
  {
    id: "t1",
    name: "teacher1",
    role: "teacher",
    passwordHash: bcrypt.hashSync("password123", 10),
  },
  {
    id: "s1",
    name: "student1",
    role: "student",
    passwordHash: bcrypt.hashSync("password123", 10),
  },
];

const quizzes = [];
const sessions = [];
const submissions = [];

// Game stores
const raceGames = {};
const bossGames = {};
const battleGames = {};
const tournaments = [];

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateJoinCode() {
  let code = "";
  for (let i = 0; i < 4; i += 1) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

function findUserByName(name) {
  return users.find((user) => user.name.toLowerCase() === name.toLowerCase());
}

module.exports = {
  users,
  quizzes,
  sessions,
  submissions,
  raceGames,
  bossGames,
  battleGames,
  tournaments,
  generateId,
  generateJoinCode,
  findUserByName,
};
