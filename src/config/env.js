const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toOriginList(value) {
  return String(value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const clientOriginRaw =
  process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:5174";
const clientOrigins = toOriginList(clientOriginRaw);

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toInt(process.env.PORT, 5000),
  mongoUri: process.env.MONGODB_URI || "",
  clientOrigin: clientOriginRaw,
  clientOrigins,
  pubMedEmail: process.env.PUBMED_EMAIL || "",
  pubMedTool: process.env.PUBMED_TOOL || "jubilantClinicalQA",
  enableClinicalTrials: process.env.ENABLE_CLINICAL_TRIALS !== "false",
  enableOpenFda: process.env.ENABLE_OPENFDA !== "false",
  enableLlmStructured: process.env.ENABLE_LLM_STRUCTURED === "true",
  llmProvider: (process.env.LLM_PROVIDER || "groq").toLowerCase(),
  llmApiUrl: process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions",
  llmApiKey: process.env.LLM_API_KEY || "",
  llmModel: process.env.LLM_MODEL || "",
  groqApiKey: process.env.GROQ_API_KEY || process.env.GROK_API_KEY || "",
};
