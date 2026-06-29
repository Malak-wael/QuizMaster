-- ============================================================
--  QuizMaster - MySQL Schema
--  Run this file once to create all tables
--  mysql -u root -p quizmaster < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS quizmaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quizmaster;

-- ─────────────────────────────────────────
--  USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           VARCHAR(36)  PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE,
  email        VARCHAR(255) NULL,
  role         ENUM('teacher','student') NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
);

-- Demo accounts (password: password123)
INSERT IGNORE INTO users (id, name, email, role, password_hash) VALUES
  ('t1', 'teacher1', 'teacher1@demo.local', 'teacher', '$2b$10$FlnQ5sD2uENJ7Pp.EmxNU.VJk5vAaRlA9a/N4czIL.G4KjxL9ufF.'),
  ('s1', 'student1', 'student1@demo.local', 'student', '$2b$10$FlnQ5sD2uENJ7Pp.EmxNU.VJk5vAaRlA9a/N4czIL.G4KjxL9ufF.');

-- ─────────────────────────────────────────
--  QUIZZES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
  id          VARCHAR(36)   PRIMARY KEY,
  teacher_id  VARCHAR(36)   NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  description TEXT,
  status      ENUM('draft','active','completed') DEFAULT 'draft',
  join_code   VARCHAR(10)   NULL,
  settings_json JSON        NULL,
  created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
--  QUESTIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id                  VARCHAR(36) PRIMARY KEY,
  quiz_id             VARCHAR(36) NOT NULL,
  question_text       TEXT        NOT NULL,
  options             JSON        NOT NULL,
  correct_option_index INT        NOT NULL,
  correct_answer_id   VARCHAR(20) NULL,
  sort_order          INT         DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
--  SESSIONS  (quiz sessions / lobby)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          VARCHAR(36)  PRIMARY KEY,
  quiz_id     VARCHAR(36)  NOT NULL,
  teacher_id  VARCHAR(36)  NOT NULL,
  join_code   VARCHAR(10)  NOT NULL UNIQUE,
  status      ENUM('waiting','live','completed') DEFAULT 'waiting',
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id)    REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id)   ON DELETE CASCADE
);

-- ─────────────────────────────────────────
--  SESSION STUDENTS  (who joined)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_students (
  session_id  VARCHAR(36) NOT NULL,
  student_id  VARCHAR(36) NOT NULL,
  joined_at   DATETIME    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id, student_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id)    ON DELETE CASCADE
);

-- ─────────────────────────────────────────
--  SUBMISSIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id           VARCHAR(36) PRIMARY KEY,
  session_id   VARCHAR(36) NOT NULL,
  student_id   VARCHAR(36) NOT NULL,
  answers      JSON        NOT NULL,
  score        INT         NOT NULL DEFAULT 0,
  submitted_at DATETIME    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_session_student (session_id, student_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id)    ON DELETE CASCADE
);

-- ─────────────────────────────────────────
--  TOURNAMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
  id           VARCHAR(36)  PRIMARY KEY,
  teacher_id   VARCHAR(36)  NOT NULL,
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  players      JSON         NOT NULL,
  rounds       JSON         NOT NULL,
  status       ENUM('active','completed') DEFAULT 'active',
  current_round INT         DEFAULT 1,
  champion     VARCHAR(100),
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
--  GAME SESSIONS  (Race / Boss / Battle)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_sessions (
  id         VARCHAR(36)  PRIMARY KEY,
  pin        VARCHAR(10)  NOT NULL UNIQUE,
  type       ENUM('race','boss','battle') NOT NULL,
  teacher_id VARCHAR(36)  NOT NULL,
  quiz_id    VARCHAR(36)  NOT NULL,
  state      JSON         NOT NULL,
  status     ENUM('waiting','active','finished','victory','defeat','playing','gameover') DEFAULT 'waiting',
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (quiz_id)    REFERENCES quizzes(id)  ON DELETE CASCADE
);


-- ─────────────────────────────────────────
--  PDF UPLOADS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pdf_uploads (
  id                VARCHAR(36)  PRIMARY KEY,
  teacher_id        VARCHAR(36)  NOT NULL,
  filename          VARCHAR(255) NOT NULL,
  original_name     VARCHAR(255) NOT NULL,
  file_size         INT          NOT NULL,
  status            ENUM('processing','completed','failed') DEFAULT 'processing',
  extracted_text    LONGTEXT,
  generated_questions JSON,
  created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);
