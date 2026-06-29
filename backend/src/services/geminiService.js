require("dotenv").config();
const axios = require("axios");

async function generateQuestions(text, count = 10) {
  console.log("🚀 Using Groq AI");

  const prompt = `
You are an expert quiz generator.

Generate EXACTLY ${count} multiple-choice questions from ONLY the document below.

VERY IMPORTANT RULES:

- Do NOT use any external knowledge.
- Every question MUST be directly answerable from the document.
- If the answer is not explicitly written in the document, DO NOT create the question.
- Every question has exactly 4 options.
- Only ONE option is correct.
- Wrong answers should be believable but MUST NOT contradict the document.
- Return ONLY valid JSON.
- No markdown.
- No explanations.
- No text before or after JSON.

Return this format exactly:

[
  {
    "question":"...",
    "options":[
      "...",
      "...",
      "...",
      "..."
    ],
    "correctOptionIndex":0
  }
]

DOCUMENT:

${text.substring(0, 5000)}
`;

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 3000,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  let content = response.data.choices[0].message.content;

  content = content.replace(/```json/g, "")
                   .replace(/```/g, "")
                   .trim();

  let data = JSON.parse(content);

  if (!Array.isArray(data)) {
    data = data.questions || [];
  }

  return data;
}

module.exports = {
  generateQuestions
};