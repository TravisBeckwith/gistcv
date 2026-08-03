import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const LLM_PROVIDER = (process.env.LLM_PROVIDER || "gemini").toLowerCase(); // "gemini" | "groq" | "anthropic"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

// --- Extract raw text from an uploaded file buffer based on mimetype/extension ---
async function extractTextFromFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === ".pdf") {
    const data = await pdfParse(file.buffer);
    return data.text;
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  if (ext === ".txt") {
    return file.buffer.toString("utf-8");
  }

  throw new Error(`Unsupported file type: ${ext}. Please upload a .pdf, .docx, or .txt file.`);
}

// --- Build the prompt sent to Claude ---
function buildPrompt(resumeText) {
  return `You are a career search strategist. Below is a candidate's resume text (raw extracted text, formatting may be imperfect).

Your job: generate a set of practical job search terms this person can paste directly into LinkedIn, Indeed, or Google job search.

Think about:
- Their actual seniority level and years of experience
- Skills, tools, and technologies mentioned
- Industries/domains they've worked in
- The fact that companies use wildly different job titles for the same role - include title variants, not just what's literally on the resume
- Adjacent or pivot roles that are a realistic stretch given their background

Return ONLY valid JSON (no markdown fences, no preamble) matching this exact shape:

{
  "summary": "one or two sentence read on their profile/level",
  "primary_titles": ["string", "..."],
  "adjacent_titles": ["string", "..."],
  "skill_keywords": ["string", "..."],
  "linkedin_boolean_searches": ["string", "..."],
  "google_xray_searches": ["string", "..."],
  "notes": "any caveats or suggestions, e.g. if the resume is thin on certain signals"
}

Resume text:
"""
${resumeText}
"""`;
}

function parseJsonFromText(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// Retries a fetch call on transient errors (503 overloaded, 429 rate limited)
// with exponential backoff. Other errors (bad key, bad request, etc.) fail immediately.
const RETRYABLE_STATUS_CODES = new Set([429, 503]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, providerName) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, options);

    if (response.ok) return response;

    const errText = await response.text();
    lastError = new Error(`${providerName} API error (${response.status}): ${errText}`);

    const isRetryable = RETRYABLE_STATUS_CODES.has(response.status);
    const isLastAttempt = attempt === MAX_RETRIES;
    if (!isRetryable || isLastAttempt) throw lastError;

    const delay = BASE_DELAY_MS * 2 ** attempt; // 1s, 2s, 4s
    console.warn(
      `${providerName} returned ${response.status} (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms...`
    );
    await sleep(delay);
  }

  throw lastError;
}

// --- Free tier: Google Gemini API (no credit card required, ~1500 req/day on Flash) ---
async function callGemini(resumeText) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey and set it in your .env file."
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetchWithRetry(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(resumeText) }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
    "Gemini"
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No text response from Gemini.");
  return parseJsonFromText(text);
}

// --- Free tier: Groq (OpenAI-compatible, fast open-weight models) ---
async function callGroq(resumeText) {
  if (!GROQ_API_KEY) {
    throw new Error(
      "Missing GROQ_API_KEY. Get a free key at https://console.groq.com/keys and set it in your .env file."
    );
  }

  const response = await fetchWithRetry(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: buildPrompt(resumeText) }],
        response_format: { type: "json_object" },
      }),
    },
    "Groq"
  );

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No text response from Groq.");
  return parseJsonFromText(text);
}

// --- Paid: Anthropic (higher quality, costs money per request) ---
async function callAnthropic(resumeText) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY. Set it in your .env file (see .env.example).");
  }

  const response = await fetchWithRetry(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: buildPrompt(resumeText) }],
      }),
    },
    "Anthropic"
  );

  const data = await response.json();
  const textBlock = data.content?.find((b) => b.type === "text");
  if (!textBlock) throw new Error("No text response from model.");
  return parseJsonFromText(textBlock.text);
}

async function callLLM(resumeText) {
  switch (LLM_PROVIDER) {
    case "gemini":
      return callGemini(resumeText);
    case "groq":
      return callGroq(resumeText);
    case "anthropic":
      return callAnthropic(resumeText);
    default:
      throw new Error(`Unknown LLM_PROVIDER "${LLM_PROVIDER}". Use "gemini", "groq", or "anthropic".`);
  }
}

// --- Routes ---

// Paste-text path
app.post("/api/analyze-text", async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: "Please provide more resume text (at least a few sentences)." });
    }
    const result = await callLLM(resumeText);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// File upload path
app.post("/api/analyze-file", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });
    const resumeText = await extractTextFromFile(req.file);
    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: "Could not extract enough text from the uploaded file." });
    }
    const result = await callLLM(resumeText);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Resume job search term generator running on http://localhost:${PORT}`));
