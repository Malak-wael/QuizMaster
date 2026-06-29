ALTER TABLE questions
ADD COLUMN correct_answer_id VARCHAR(20) NULL AFTER correct_option_index;

UPDATE questions
SET correct_answer_id = CONCAT('opt_', correct_option_index + 1)
WHERE correct_answer_id IS NULL;
