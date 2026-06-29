USE quizmaster;

ALTER TABLE quizzes
  ADD COLUMN status ENUM('draft','active','completed') DEFAULT 'draft' AFTER description;

ALTER TABLE quizzes
  ADD COLUMN join_code VARCHAR(10) NULL AFTER status;

ALTER TABLE quizzes
  ADD COLUMN settings_json JSON NULL AFTER join_code;
