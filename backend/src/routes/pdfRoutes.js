console.log("✅ Using PDF Routes");
const express = require("express");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const upload = require("../middleware/fileUpload");
const { query, queryOne, generateId, generateUniqueJoinCode } = require("../db/helpers");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  isMeaningfulOption,
  optionIdForIndex,
  indexForOptionId,
  shuffleQuestionOptionsDeterministic,
} = require("../utils/questionValidation");

const router = express.Router();
router.use(requireAuth);
router.use(requireRole("teacher"));

function normalizeGeneratedQuestion(question, index = 0) {
  const rawOptions = (Array.isArray(question?.options) ? question.options : [])
    .map((value) => String(value ?? "").trim())
    .filter((value) => isMeaningfulOption(value));
  const uniqueOptions = Array.from(new Set(rawOptions.map((value) => value.toLowerCase())));
  if (uniqueOptions.length !== 4) return null;
  const options = uniqueOptions.map(
    (value) => rawOptions.find((candidate) => candidate.toLowerCase() === value) || value
  );

  const rawCorrectAnswerId = String(question?.correctAnswerId || "").trim();
  let correctOptionIndex = indexForOptionId(rawCorrectAnswerId);
  if (correctOptionIndex < 0) {
    correctOptionIndex = Number.isInteger(question?.correctOptionIndex)
      ? question.correctOptionIndex
      : Number.isInteger(question?.correctAnswer)
        ? question.correctAnswer
        : 0;
  }
  if (correctOptionIndex < 0 || correctOptionIndex > 3) return null;
  const correctAnswerId = optionIdForIndex(correctOptionIndex);

  return {
    question:
      (typeof question?.question === "string" && question.question.trim()) ||
      `Generated Question ${index + 1}`,
    options,
    optionIds: options.map((_, i) => optionIdForIndex(i)),
    correctAnswerId,
    correctOptionIndex,
    correctAnswer: correctOptionIndex,
    is_correct: options.map((_, i) => i === correctOptionIndex),
  };
}

function extractQuestionsFromMarkedText(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const questions = [];
  let current = null;
  let questionType = null; // 'mcq', 'tf', 'fill'

  const isQuestionLine = (line) =>
    /^(q(uestion)?\s*\d+[\.\):\-]?|[\d]+[\.\)]\s+|س\d+[\.\):\-]?)/i.test(line);
  const isOptionLine = (line) => /^([A-Da-d]|[1-4])[\)\.\-:]\s+/.test(line);
  const isTrueFalseLine = (line) =>
    /^(true|false|صح|غلط|correct|incorrect|نعم|لا)[\)\.\-:]?\s*/i.test(line);
  const isAnswerLine = (line) =>
    /^(answer|correct answer|ans|الإجابة|الجواب)\s*[:\-]\s*/i.test(line);
  const isFillBlankLine = (line) =>
    /^fill\s*[:\-]?\s*/i.test(line) || line.includes("_____") || line.includes("....");

  const parseOptionIndex = (token) => {
    const t = String(token || "").trim().toUpperCase();
    if (["A", "B", "C", "D"].includes(t)) return t.charCodeAt(0) - 65;
    if (["1", "2", "3", "4"].includes(t)) return Number(t) - 1;
    return 0;
  };

  for (const line of lines) {
    if (isQuestionLine(line)) {
      if (current) {
        const normalized = normalizeGeneratedQuestion(current, questions.length);
        if (normalized) questions.push(normalized);
      }
      current = {
        question: line.replace(/^(q(uestion)?\s*\d+[\.\):\-]?|[\d]+[\.\)]\s+|س\d+[\.\):\-]?)/i, "").trim() || line,
        options: [],
        correctOptionIndex: 0,
      };
      questionType = null;
      continue;
    }

    if (!current) continue;

    // Detect question type
    if (!questionType) {
      if (isOptionLine(line)) questionType = 'mcq';
      else if (isTrueFalseLine(line)) questionType = 'tf';
      else if (isFillBlankLine(line)) questionType = 'fill';
    }

    if (questionType === 'mcq' && isOptionLine(line)) {
      const optionText = line.replace(/^([A-Da-d]|[1-4])[\)\.\-:]\s+/, "").trim();
      current.options.push(optionText);
      continue;
    }

    if (questionType === 'tf' && isTrueFalseLine(line)) {
      const tfText = line.replace(/^(true|false|صح|غلط|correct|incorrect|نعم|لا)[\)\.\-:]?\s*/i, "").trim();
      const isTrue = /^(true|صح|correct|نعم)/i.test(line);
      current.options.push(isTrue ? "True" : "False");
      current.correctOptionIndex = isTrue ? 0 : 1;
      continue;
    }

    if (questionType === 'fill' && isFillBlankLine(line)) {
      const answer = line.replace(/^fill\s*[:\-]?\s*/i, "").trim();
      current.options = [answer, "Wrong Answer 1", "Wrong Answer 2", "Wrong Answer 3"];
      current.correctOptionIndex = 0;
      continue;
    }

    if (isAnswerLine(line)) {
      const m = line.match(/[:\-]\s*([A-Da-d1-4])/);
      if (m) current.correctOptionIndex = parseOptionIndex(m[1]);
      const tfMatch = line.match(/[:\-]\s*(true|false|صح|غلط)/i);
      if (tfMatch) {
        current.options = ["True", "False"];
        current.correctOptionIndex = /^(true|صح)/i.test(tfMatch[1]) ? 0 : 1;
      }
      continue;
    }

    // Continuation line for question text when no options started yet
    if ((current.options || []).length === 0) {
      current.question = `${current.question} ${line}`.trim();
    }
  }

  if (current) {
    const normalized = normalizeGeneratedQuestion(current, questions.length);
    if (normalized) questions.push(normalized);
  }

  return questions.filter(Boolean);
}

function buildConceptQuestions(text) {
  const markedQuestions = extractQuestionsFromMarkedText(text);
  if (markedQuestions.length > 0) {
    return markedQuestions.map((q, i) => normalizeGeneratedQuestion(q, i));
  }
  const normalizedText = String(text || "").replace(/\s+/g, " ").trim();
  const sentences = normalizedText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 50 && s.length <= 220);
  const tokens = normalizedText.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || [];
  const stopWords = new Set(["that", "this", "with", "from", "into", "have", "will", "were", "their", "about", "which", "when", "where", "what", "your", "there", "than", "then", "them", "they", "would", "could"]);
  const frequency = {};
  for (const token of tokens) {
    if (stopWords.has(token)) continue;
    frequency[token] = (frequency[token] || 0) + 1;
  }
  const topTerms = Object.entries(frequency).filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]).map(([term]) => term).slice(0, 40);

  const sentenceTerms = sentences.map((sentence) =>
    (sentence.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || []).filter((token) => !stopWords.has(token))
  );

  const pickDistractors = (answer, sentenceIndex) => {
    const answerLc = answer.toLowerCase();
    const localPool = (sentenceTerms[sentenceIndex] || [])
      .filter((term) => term !== answerLc && topTerms.includes(term));
    const globalPool = topTerms.filter((term) => term !== answerLc);
    const mergedPool = [...new Set([...localPool, ...globalPool])];

    // Prioritize terms with similar length and style to produce believable options.
    mergedPool.sort((a, b) => {
      const aScore = Math.abs(a.length - answerLc.length);
      const bScore = Math.abs(b.length - answerLc.length);
      return aScore - bScore;
    });

    const selected = [];
    for (const term of mergedPool) {
      if (selected.length >= 3) break;
      if (selected.some((picked) => picked.toLowerCase() === term.toLowerCase())) continue;
      // Avoid near-duplicate stems like "compute" vs "computer" as distractors.
      if (term.includes(answerLc) || answerLc.includes(term)) continue;
      selected.push(term);
    }
    return selected;
  };

  const questionSet = [];
  const seenQuestions = new Set();
  for (const term of topTerms) {
    const sentenceIndex = sentences.findIndex(
      (s) => new RegExp(`\\b${term}\\b`, "i").test(s) && !seenQuestions.has(s.toLowerCase())
    );
    const sentence = sentenceIndex >= 0 ? sentences[sentenceIndex] : null;
    if (!sentence) continue;
    const distractors = pickDistractors(term, sentenceIndex);
    if (distractors.length < 3) continue;
    const options = [term, ...distractors].map((o) => o.charAt(0).toUpperCase() + o.slice(1));
    questionSet.push(
      normalizeGeneratedQuestion(
        {
          question: `Which concept best completes this statement from the file: "${sentence.replace(new RegExp(`\\b${term}\\b`, "i"), "_____")}"`,
          options,
          correctOptionIndex: 0,
        },
        questionSet.length
      )
    );
    seenQuestions.add(sentence.toLowerCase());
  }
  return questionSet;
}

function generateQuestionsFromText(text, requestedCount) {
  const baseQuestions = buildConceptQuestions(text);
  const unique = [];
  const seen = new Set();
  for (const question of baseQuestions) {
    const key = `${question.question}::${question.options.join("|")}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(question);
  }
  const count = Number.isInteger(requestedCount) ? requestedCount : null;
  if (!count) return unique;
  if (count < 1) return [];
  if (unique.length < count) return [];
  return unique.slice(0, count);
}

function detectMimeType(filename) {
  const ext = String(path.extname(filename || "")).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".txt") return "text/plain; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".csv") return "text/csv; charset=utf-8";
  if (ext === ".docx")
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/octet-stream";
}

async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();
  if (ext === ".txt") return fs.readFileSync(filePath, "utf8");
  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return String(result.value || "");
  }
  let pdfParse;
  try {
    pdfParse = require("pdf-parse/lib/pdf-parse.js");
  } catch {
    const mainEntry = require("pdf-parse");
    pdfParse = typeof mainEntry === "function" ? mainEntry : mainEntry.default;
  }
  if (typeof pdfParse !== "function") throw new Error("pdf parser function not found");
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  return String(pdfData?.text || "");
}

// POST /api/v1/pdf/upload
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "A file is required" });
  }

  const uploadId = generateId("pdf");

  try {
    // Save record to DB immediately with 'processing' status
    await query(
      "INSERT INTO pdf_uploads (id, teacher_id, filename, original_name, file_size, status) VALUES (?,?,?,?,?,?)",
      [uploadId, req.user.id, req.file.filename, req.file.originalname, req.file.size, "processing"]
    );

    // Parse uploaded file in background
    const filePath = req.file.path;

    (async () => {
      try {
        const extractedText = (await extractTextFromFile(filePath, req.file.originalname)).slice(0, 50000);
        const { generateQuestions } = require("../services/geminiService");

        const generatedQuestions = await generateQuestions(extractedText, 10);
        if (!generatedQuestions.length) {
          await query(
            "UPDATE pdf_uploads SET status='failed', extracted_text=?, generated_questions=? WHERE id=?",
            [extractedText, JSON.stringify([]), uploadId]
          );
          return;
        }

        await query(
          "UPDATE pdf_uploads SET status='completed', extracted_text=?, generated_questions=? WHERE id=?",
          [extractedText, JSON.stringify(generatedQuestions), uploadId]
        );
      } catch (parseErr) {
        console.error("PDF parse error:", parseErr.message);
        await query(
          "UPDATE pdf_uploads SET status='failed', extracted_text=?, generated_questions=? WHERE id=?",
          ["", JSON.stringify([]), uploadId]
        );
      }
    })();

    return res.status(201).json({
      uploadId,
      filename: req.file.originalname,
      status: "processing",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/pdf/:uploadId/status
router.get("/:uploadId/status", async (req, res) => {
  try {
    const upload = await queryOne(
      "SELECT id, status, original_name, file_size, created_at, extracted_text, generated_questions FROM pdf_uploads WHERE id=? AND teacher_id=?",
      [req.params.uploadId, req.user.id]
    );
    if (!upload) return res.status(404).json({ message: "Upload not found" });
    const progress =
      upload.status === "completed" ? 100 : upload.status === "processing" ? 50 : upload.status === "failed" ? 0 : 0;
    const body = {
      status: upload.status,
      progress,
      filename: upload.original_name,
    };
    if (upload.status === "completed") {
      body.extractedText = (upload.extracted_text || "").slice(0, 2000);
      if (upload.generated_questions) {
        try {
          const gq =
            typeof upload.generated_questions === "string"
              ? JSON.parse(upload.generated_questions)
              : upload.generated_questions;
          body.generatedQuestions = gq;
        } catch {
          /* ignore */
        }
      }
    }
    return res.json(body);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/v1/pdf/:uploadId/questions
router.get("/:uploadId/questions", async (req, res) => {
  try {
    const upload = await queryOne(
      "SELECT * FROM pdf_uploads WHERE id=? AND teacher_id=?",
      [req.params.uploadId, req.user.id]
    );
    if (!upload) return res.status(404).json({ message: "Upload not found" });
    if (upload.status !== "completed")
      return res.status(400).json({ message: `PDF is still ${upload.status}` });

    let questionsRaw;
    try {
      questionsRaw = typeof upload.generated_questions === "string"
        ? JSON.parse(upload.generated_questions)
        : upload.generated_questions;
    } catch {
      questionsRaw = [];
    }
    const questions = Array.isArray(questionsRaw)
      ? questionsRaw
        .map((q, i) => normalizeGeneratedQuestion(q, i))
        .filter(Boolean)
        .map((q, i) =>
          shuffleQuestionOptionsDeterministic(
            q,
            `${req.user.id}:${req.params.uploadId}:${Date.now()}:${Math.random()}:${i}`
          )
        )
        .filter(Boolean)
      : [];

    return res.json({ questions, filename: upload.original_name });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/v1/pdf/:uploadId/confirm  (create quiz from PDF questions)
router.post("/:uploadId/confirm", async (req, res) => {
  console.log("✅ Confirm route hit");
  console.log("Upload ID:", req.params.uploadId);
  const { title, description, selectedIndices, questionCount } = req.body;
  if (!title) return res.status(400).json({ message: "title is required" });

  try {
    const pdfUpload = await queryOne(
      "SELECT * FROM pdf_uploads WHERE id=? AND teacher_id=?",
      [req.params.uploadId, req.user.id]
    );
    if (!pdfUpload) return res.status(404).json({ message: "Upload not found" });
    if (pdfUpload.status !== "completed")
      return res.status(400).json({ message: "PDF processing not complete" });

    let allQuestions = typeof pdfUpload.generated_questions === "string"
      ? JSON.parse(pdfUpload.generated_questions)
      : pdfUpload.generated_questions;

    const sourceQuestions = Array.isArray(selectedIndices) && selectedIndices.length > 0
      ? selectedIndices.map(i => allQuestions[i]).filter(Boolean)
      : allQuestions;
    const normalizedPool = (Array.isArray(sourceQuestions) ? sourceQuestions : [])
      .map((q, i) => normalizeGeneratedQuestion(q, i))
      .filter(Boolean);
    const requestedCount = Number(questionCount);
    if (!Number.isInteger(requestedCount) || requestedCount < 1) {
      return res.status(400).json({ message: "questionCount must be a positive integer" });
    }
    if (normalizedPool.length < requestedCount) {
      return res.status(400).json({ message: `Only ${normalizedPool.length} questions available, cannot generate ${requestedCount}` });
    }
    const normalizedQuestions = normalizedPool.slice(0, requestedCount);

    // Create quiz
    const quizId = generateId("quiz");
    await query(
      "INSERT INTO quizzes (id, teacher_id, title, description) VALUES (?,?,?,?)",
      [quizId, req.user.id, title, description || `Generated from ${pdfUpload.original_name}`]
    );

    for (let i = 0; i < normalizedQuestions.length; i++) {
      const q = normalizedQuestions[i];
      const correctIdx = q.correctOptionIndex ?? q.correctAnswer ?? 0;
      const correctAnswerId = q.correctAnswerId || optionIdForIndex(correctIdx);
      try {
        await query(
          "INSERT INTO questions (id, quiz_id, question_text, options, correct_option_index, correct_answer_id, sort_order) VALUES (?,?,?,?,?,?,?)",
          [generateId("q"), quizId, q.question, JSON.stringify(q.options), correctIdx, correctAnswerId, i]
        );
      } catch (insertError) {
        if (!String(insertError?.message || "").includes("Unknown column")) throw insertError;
        await query(
          "INSERT INTO questions (id, quiz_id, question_text, options, correct_option_index, sort_order) VALUES (?,?,?,?,?,?)",
          [generateId("q"), quizId, q.question, JSON.stringify(q.options), correctIdx, i]
        );
      }
    }

    const sessionId = generateId("session");
    const accessCode = await generateUniqueJoinCode();
    await query(
      "INSERT INTO sessions (id,quiz_id,teacher_id,join_code,status) VALUES (?,?,?,?,?)",
      [sessionId, quizId, req.user.id, accessCode, "waiting"]
    );

    return res.status(201).json({
      message: "Quiz created successfully",
      quizId,
      sessionId,
      accessCode,
      questionsCount: normalizedQuestions.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/v1/pdf  (list all uploads for teacher)
router.get("/", async (req, res) => {
  try {
    const uploads = await query(
      "SELECT id, original_name, file_size, status, created_at FROM pdf_uploads WHERE teacher_id=? ORDER BY created_at DESC",
      [req.user.id]
    );
    return res.json({ uploads });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/v1/pdf/:uploadId
router.get("/:uploadId", async (req, res) => {
  try {
    const upload = await queryOne(
      "SELECT id, filename, original_name, file_size, status, extracted_text, created_at FROM pdf_uploads WHERE id=? AND teacher_id=?",
      [req.params.uploadId, req.user.id]
    );
    if (!upload) return res.status(404).json({ message: "Upload not found" });
    return res.json({
      id: upload.id,
      filename: upload.filename,
      originalName: upload.original_name,
      fileSize: upload.file_size,
      status: upload.status,
      mimeType: detectMimeType(upload.original_name),
      extractedTextPreview: String(upload.extracted_text || "").slice(0, 5000),
      createdAt: upload.created_at,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/v1/pdf/:uploadId/content
router.get("/:uploadId/content", async (req, res) => {
  try {
    const upload = await queryOne(
      "SELECT id, filename, original_name FROM pdf_uploads WHERE id=? AND teacher_id=?",
      [req.params.uploadId, req.user.id]
    );
    if (!upload) return res.status(404).json({ message: "Upload not found" });
    const filePath = path.join(__dirname, "../../uploads", upload.filename || "");
    if (!upload.filename || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File content not found" });
    }
    res.setHeader("Content-Type", detectMimeType(upload.original_name || upload.filename));
    return res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
