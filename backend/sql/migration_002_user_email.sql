-- Run once if upgrading from schema without email:
-- mysql -u root -p quizmaster < migration_002_user_email.sql

USE quizmaster;

ALTER TABLE users
  ADD COLUMN email VARCHAR(255) NULL AFTER name;

ALTER TABLE users
  ADD UNIQUE KEY uq_users_email (email);

UPDATE users SET email = 'teacher1@demo.local' WHERE id = 't1' AND (email IS NULL OR email = '');
UPDATE users SET email = 'student1@demo.local' WHERE id = 's1' AND (email IS NULL OR email = '');
