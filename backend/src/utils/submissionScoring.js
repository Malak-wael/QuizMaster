"use strict";

function normalizeSubmissionAnswers(answers) {
  const uniqueByQuestion = new Map();
  for (const answer of Array.isArray(answers) ? answers : []) {
    const questionIndex = Number(answer?.questionIndex);
    const selectedOptionIndex = Number(answer?.selectedAnswer ?? answer?.selectedOptionIndex);
    if (!Number.isInteger(questionIndex) || questionIndex < 0) continue;
    if (!Number.isInteger(selectedOptionIndex) || selectedOptionIndex < 0) continue;
    uniqueByQuestion.set(questionIndex, selectedOptionIndex);
  }
  return Array.from(uniqueByQuestion.entries()).map(([qIdx, sIdx]) => ({
    questionIndex: qIdx,
    selectedOptionIndex: sIdx,
  }));
}

function computeScoreFromNormalizedAnswers(questions, normalizedAnswers) {
  let score = 0;
  for (const answer of normalizedAnswers) {
    const question = questions[answer.questionIndex];
    if (!question) continue;
    if (Number(answer.selectedOptionIndex) === Number(question.correct_option_index)) {
      score += 1;
    }
  }
  return score;
}

module.exports = { normalizeSubmissionAnswers, computeScoreFromNormalizedAnswers };
