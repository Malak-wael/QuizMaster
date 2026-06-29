USE quizmaster;

-- Repair runtime schema without strict FKs, to support pre-existing DB variants.
-- Existing DB uses BIGINT user/quiz ids, while app runtime ids are mixed.

CREATE TABLE IF NOT EXISTS questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  quiz_id BIGINT UNSIGNED NOT NULL,
  question_text TEXT NOT NULL,
  options LONGTEXT NOT NULL,
  correct_option_index INT NOT NULL,
  sort_order INT DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_questions_quiz_id (quiz_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) NOT NULL,
  quiz_id BIGINT UNSIGNED NULL,
  teacher_id BIGINT UNSIGNED NULL,
  join_code VARCHAR(20) NOT NULL,
  status ENUM('waiting','live','completed') DEFAULT 'waiting',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_join_code (join_code),
  KEY idx_sessions_teacher (teacher_id),
  KEY idx_sessions_quiz (quiz_id)
);

CREATE TABLE IF NOT EXISTS session_students (
  session_id VARCHAR(64) NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id, student_id),
  KEY idx_ss_student (student_id)
);

CREATE TABLE IF NOT EXISTS submissions (
  id VARCHAR(64) NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  student_id BIGINT UNSIGNED NOT NULL,
  answers LONGTEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_submissions_session_student (session_id, student_id),
  KEY idx_submissions_session (session_id),
  KEY idx_submissions_student (student_id)
);

CREATE TABLE IF NOT EXISTS pdf_uploads (
  id VARCHAR(255) NOT NULL,
  teacher_id BIGINT UNSIGNED NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size INT DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Add missing pdf_uploads columns if table came from older schema
SET @has_extracted_text := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pdf_uploads'
    AND COLUMN_NAME = 'extracted_text'
);
SET @sql_extracted_text := IF(
  @has_extracted_text = 0,
  'ALTER TABLE pdf_uploads ADD COLUMN extracted_text LONGTEXT',
  'SELECT "pdf_uploads.extracted_text already exists"'
);
PREPARE stmt_extracted_text FROM @sql_extracted_text;
EXECUTE stmt_extracted_text;
DEALLOCATE PREPARE stmt_extracted_text;

SET @has_generated_questions := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pdf_uploads'
    AND COLUMN_NAME = 'generated_questions'
);
SET @sql_generated_questions := IF(
  @has_generated_questions = 0,
  'ALTER TABLE pdf_uploads ADD COLUMN generated_questions JSON',
  'SELECT "pdf_uploads.generated_questions already exists"'
);
PREPARE stmt_generated_questions FROM @sql_generated_questions;
EXECUTE stmt_generated_questions;
DEALLOCATE PREPARE stmt_generated_questions;
