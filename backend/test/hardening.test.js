"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeQuestionInputStrict,
  sanitizeQuestionForStudent,
  shuffleQuestionOptionsDeterministic,
} = require("../src/utils/questionValidation");
const {
  normalizeSubmissionAnswers,
  computeScoreFromNormalizedAnswers,
} = require("../src/utils/submissionScoring");

test("strict MCQ validation rejects malformed questions", () => {
  assert.throws(
    () =>
      normalizeQuestionInputStrict({
        question: "What is 2+2?",
        options: ["4", "4", "5", "6"],
        correctOptionIndex: 0,
      }),
    /unique/
  );
});

test("duplicate answers do not inflate score", () => {
  const normalized = normalizeSubmissionAnswers([
    { questionIndex: 0, selectedOptionIndex: 1 },
    { questionIndex: 0, selectedOptionIndex: 2 },
    { questionIndex: 1, selectedOptionIndex: 3 },
  ]);
  const questions = [{ correct_option_index: 2 }, { correct_option_index: 3 }];
  const score = computeScoreFromNormalizedAnswers(questions, normalized);
  assert.equal(score, 2);
  assert.equal(normalized.length, 2);
});

test("student-safe payload strips answer keys", () => {
  const safe = sanitizeQuestionForStudent({
    id: "q1",
    question: "Capital of France?",
    options: ["Paris", "Rome", "Berlin", "Madrid"],
    correctOptionIndex: 0,
    correctAnswer: 0,
  });
  assert.equal(safe.question, "Capital of France?");
  assert.equal("correctOptionIndex" in safe, false);
  assert.equal("correctAnswer" in safe, false);
});

test("deterministic option shuffling preserves correctness", () => {
  const shuffled = shuffleQuestionOptionsDeterministic(
    {
      question: "Pick A",
      options: ["A", "B", "C", "D"],
      correctOptionIndex: 0,
    },
    "seed-1"
  );
  assert.equal(shuffled.options.length, 4);
  assert.equal(shuffled.options[shuffled.correctOptionIndex], "A");
});
