"use strict";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isMeaningfulOption(value) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  // Require at least one letter/number so symbols-only options are rejected.
  return /[\p{L}\p{N}]/u.test(text);
}

function optionIdForIndex(index) {
  return `opt_${Number(index) + 1}`;
}

function indexForOptionId(optionId) {
  const match = String(optionId || "").match(/^opt_(\d+)$/);
  if (!match) return -1;
  const index = Number(match[1]) - 1;
  return Number.isInteger(index) ? index : -1;
}

function normalizeQuestionInputStrict(question, index = 0) {
  const stem = String(question?.text ?? question?.question ?? "").trim();
  if (!isNonEmptyString(stem)) {
    throw new Error(`Question ${index + 1} must have a non-empty stem`);
  }

  if (!Array.isArray(question?.options) || question.options.length !== 4) {
    throw new Error(`Question ${index + 1} must have exactly 4 options`);
  }

  const options = question.options.map((option, optionIndex) => {
    const text = String(option ?? "").trim();
    if (!isMeaningfulOption(text)) {
      throw new Error(`Question ${index + 1} option ${optionIndex + 1} must be meaningful`);
    }
    return text;
  });

  const uniqueOptions = new Set(options.map((option) => option.toLowerCase()));
  if (uniqueOptions.size !== 4) {
    throw new Error(`Question ${index + 1} options must be unique`);
  }

  const rawCorrect = question?.correctOptionIndex ?? question?.correctAnswer;
  if (!Number.isInteger(rawCorrect) || rawCorrect < 0 || rawCorrect > 3) {
    throw new Error(`Question ${index + 1} correct option index must be in range 0-3`);
  }

  return {
    question: stem,
    options,
    optionIds: options.map((_, optionIndex) => optionIdForIndex(optionIndex)),
    correctAnswerId: optionIdForIndex(rawCorrect),
    correctOptionIndex: rawCorrect,
    correctAnswer: rawCorrect,
  };
}

function validateQuestionArrayStrict(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("At least one question is required");
  }
  return questions.map((question, index) => normalizeQuestionInputStrict(question, index));
}

function sanitizeQuestionForStudent(question, index = 0) {
  return {
    id: question?.id ?? index + 1,
    text: question?.text ?? question?.question ?? "",
    question: question?.question ?? question?.text ?? "",
    options: Array.isArray(question?.options) ? question.options : [],
    timeLimit: question?.timeLimit,
  };
}

function normalizeSubmissionAnswersDedup(answers) {
  const uniqueByQuestion = new Map();
  for (const answer of Array.isArray(answers) ? answers : []) {
    const questionIndex = Number(answer?.questionIndex);
    const selectedOptionIndex = Number(answer?.selectedAnswer ?? answer?.selectedOptionIndex);
    if (!Number.isInteger(questionIndex) || questionIndex < 0) continue;
    if (!Number.isInteger(selectedOptionIndex) || selectedOptionIndex < 0) continue;
    uniqueByQuestion.set(questionIndex, selectedOptionIndex);
  }
  return Array.from(uniqueByQuestion.entries()).map(([questionIndex, selectedOptionIndex]) => ({
    questionIndex,
    selectedOptionIndex,
  }));
}

function stableHash(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

function deterministicShuffle(items, seedText) {
  const result = [...items];
  let seed = stableHash(String(seedText || "seed"));
  for (let i = result.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

function shuffleQuestionOptionsDeterministic(question, seedText) {
  const optionIds = Array.isArray(question?.optionIds)
    ? question.optionIds
    : (question?.options || []).map((_, index) => optionIdForIndex(index));
  const indexed = question.options.map((option, index) => ({
    option,
    optionId: optionIds[index] || optionIdForIndex(index),
    index,
  }));
  const shuffled = deterministicShuffle(indexed, seedText);
  const options = shuffled.map((entry) => entry.option);
  const shuffledOptionIds = shuffled.map((entry) => entry.optionId);
  const correctOptionIndex = shuffled.findIndex(
    (entry) =>
      entry.index === question.correctOptionIndex ||
      entry.optionId === question.correctAnswerId
  );
  return {
    ...question,
    options,
    optionIds: shuffledOptionIds,
    optionsWithIds: shuffled.map((entry) => ({ id: entry.optionId, text: entry.option })),
    correctAnswerId: shuffledOptionIds[correctOptionIndex] || null,
    correctOptionIndex,
    correctAnswer: correctOptionIndex,
  };
}

module.exports = {
  isNonEmptyString,
  normalizeQuestionInputStrict,
  validateQuestionArrayStrict,
  isMeaningfulOption,
  optionIdForIndex,
  indexForOptionId,
  sanitizeQuestionForStudent,
  normalizeSubmissionAnswersDedup,
  deterministicShuffle,
  shuffleQuestionOptionsDeterministic,
};
