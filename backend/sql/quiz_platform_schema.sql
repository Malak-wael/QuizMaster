CREATE DATABASE IF NOT EXISTS quiz_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quiz_platform;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS game_events;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS tournament_round_matches;
DROP TABLE IF EXISTS tournament_rounds;
DROP TABLE IF EXISTS tournament_participants;
DROP TABLE IF EXISTS tournaments;
DROP TABLE IF EXISTS student_answers;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS session_participants;
DROP TABLE IF EXISTS quiz_sessions;
DROP TABLE IF EXISTS quiz_options;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('teacher', 'student', 'admin') NOT NULL DEFAULT 'student',
  avatar_url VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_name (name),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB;

CREATE TABLE quizzes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  teacher_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  difficulty ENUM('easy', 'medium', 'hard') NULL,
  time_limit_sec INT UNSIGNED NULL,
  shuffle_questions TINYINT(1) NOT NULL DEFAULT 0,
  shuffle_options TINYINT(1) NOT NULL DEFAULT 0,
  max_attempts INT UNSIGNED NULL,
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quizzes_teacher (teacher_id),
  KEY idx_quizzes_status (status),
  CONSTRAINT fk_quizzes_teacher
    FOREIGN KEY (teacher_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quiz_questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quiz_id BIGINT UNSIGNED NOT NULL,
  question_order INT UNSIGNED NOT NULL,
  question_type ENUM('mcq_single', 'mcq_multi', 'true_false', 'short_text') NOT NULL DEFAULT 'mcq_single',
  question_text TEXT NOT NULL,
  points DECIMAL(8,2) NOT NULL DEFAULT 1.00,
  explanation TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_quiz_question_order (quiz_id, question_order),
  KEY idx_questions_quiz (quiz_id),
  CONSTRAINT fk_questions_quiz
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quiz_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id BIGINT UNSIGNED NOT NULL,
  option_order INT UNSIGNED NOT NULL,
  option_text VARCHAR(1000) NOT NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_question_option_order (question_id, option_order),
  KEY idx_options_question (question_id),
  KEY idx_options_correct (question_id, is_correct),
  CONSTRAINT fk_options_question
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quiz_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quiz_id BIGINT UNSIGNED NOT NULL,
  teacher_id BIGINT UNSIGNED NOT NULL,
  session_code CHAR(6) NOT NULL,
  mode ENUM('quiz', 'battle', 'team_race', 'boss') NOT NULL DEFAULT 'quiz',
  status ENUM('waiting', 'live', 'paused', 'completed', 'cancelled') NOT NULL DEFAULT 'waiting',
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  settings_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_session_code (session_code),
  KEY idx_sessions_quiz (quiz_id),
  KEY idx_sessions_teacher (teacher_id),
  KEY idx_sessions_status (status),
  CONSTRAINT fk_sessions_quiz
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_sessions_teacher
    FOREIGN KEY (teacher_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE session_participants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  display_name VARCHAR(100) NULL,
  team_name VARCHAR(100) NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at DATETIME NULL,
  is_connected TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_session_student (session_id, student_id),
  KEY idx_participants_student (student_id),
  KEY idx_participants_session_connected (session_id, is_connected),
  CONSTRAINT fk_participants_session
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_participants_student
    FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quiz_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  quiz_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  attempt_no INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('in_progress', 'submitted', 'graded') NOT NULL DEFAULT 'in_progress',
  total_questions INT UNSIGNED NOT NULL DEFAULT 0,
  correct_count INT UNSIGNED NOT NULL DEFAULT 0,
  score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME NULL,
  graded_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attempt_per_session_student_no (session_id, student_id, attempt_no),
  KEY idx_attempts_student (student_id),
  KEY idx_attempts_session (session_id),
  KEY idx_attempts_quiz (quiz_id),
  CONSTRAINT fk_attempts_session
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_attempts_quiz
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_attempts_student
    FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE student_answers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attempt_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  selected_option_id BIGINT UNSIGNED NULL,
  answer_text TEXT NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  points_awarded DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  response_time_ms INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attempt_question (attempt_id, question_id),
  KEY idx_answers_question (question_id),
  KEY idx_answers_option (selected_option_id),
  CONSTRAINT fk_answers_attempt
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_answers_question
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_answers_option
    FOREIGN KEY (selected_option_id) REFERENCES quiz_options(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tournaments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  teacher_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  status ENUM('draft', 'scheduled', 'live', 'completed', 'cancelled') NOT NULL DEFAULT 'draft',
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tournaments_teacher (teacher_id),
  KEY idx_tournaments_status (status),
  CONSTRAINT fk_tournaments_teacher
    FOREIGN KEY (teacher_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tournament_participants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tournament_id BIGINT UNSIGNED NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  seed_no INT UNSIGNED NULL,
  current_status ENUM('active', 'eliminated', 'winner') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tournament_student (tournament_id, student_id),
  KEY idx_tournament_participants_student (student_id),
  CONSTRAINT fk_tournament_participants_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tournament_participants_student
    FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tournament_rounds (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tournament_id BIGINT UNSIGNED NOT NULL,
  round_no INT UNSIGNED NOT NULL,
  name VARCHAR(100) NULL,
  status ENUM('pending', 'live', 'completed') NOT NULL DEFAULT 'pending',
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tournament_round (tournament_id, round_no),
  CONSTRAINT fk_rounds_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tournament_round_matches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  round_id BIGINT UNSIGNED NOT NULL,
  match_no INT UNSIGNED NOT NULL,
  participant_a_id BIGINT UNSIGNED NULL,
  participant_b_id BIGINT UNSIGNED NULL,
  winner_participant_id BIGINT UNSIGNED NULL,
  session_id BIGINT UNSIGNED NULL,
  status ENUM('pending', 'live', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_round_match (round_id, match_no),
  KEY idx_match_winner (winner_participant_id),
  KEY idx_match_session (session_id),
  CONSTRAINT fk_matches_round
    FOREIGN KEY (round_id) REFERENCES tournament_rounds(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_matches_participant_a
    FOREIGN KEY (participant_a_id) REFERENCES tournament_participants(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_matches_participant_b
    FOREIGN KEY (participant_b_id) REFERENCES tournament_participants(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_matches_winner
    FOREIGN KEY (winner_participant_id) REFERENCES tournament_participants(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_matches_session
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE game_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  game_mode ENUM('battle', 'team_race', 'boss') NOT NULL,
  state_json JSON NULL,
  status ENUM('waiting', 'live', 'paused', 'completed', 'cancelled') NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_game_session (session_id, game_mode),
  KEY idx_game_mode_status (game_mode, status),
  CONSTRAINT fk_game_sessions_session
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE game_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_session_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  payload_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_game_events_session_time (game_session_id, created_at),
  KEY idx_game_events_type (event_type),
  CONSTRAINT fk_game_events_session
    FOREIGN KEY (game_session_id) REFERENCES game_sessions(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_game_events_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO users (name, email, password_hash, role)
VALUES
  ('teacher1', 'teacher1@example.com', '$2a$10$examplehashedpasswordteacher', 'teacher'),
  ('student1', 'student1@example.com', '$2a$10$examplehashedpasswordstudent', 'student');
