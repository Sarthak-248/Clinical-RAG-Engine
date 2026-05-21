const axios = require("axios");
const env = require("../config/env");

const REQUEST_TIMEOUT = 20000;

function isGroqProvider() {
  const provider = String(env.llmProvider || "").toLowerCase();
  return provider === "groq" || String(env.llmApiUrl || "").includes("api.groq.com");
}

function clip(text, max = 500) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function safeParseJson(value) {
  if (!value) return null;

  const direct = String(value).trim();
  try {
    return JSON.parse(direct);
  } catch (error) {
    const codeBlockMatch = direct.match(/```json\s*([\s\S]*?)```/i);
    if (codeBlockMatch?.[1]) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch (innerError) {
        return null;
      }
    }

    const objectMatch = direct.match(/\{[\s\S]*\}/);
    if (objectMatch?.[0]) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch (innerError) {
        return null;
      }
    }

    return null;
  }
}

function normalizeStructuredAnswer(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  const summary = clip(parsed.summary, 1400);
  const keyPoints = Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map((item) => clip(item, 280)).filter(Boolean).slice(0, 5) : [];
  const recommendations = Array.isArray(parsed.recommendations)
    ? parsed.recommendations.map((item) => clip(item, 280)).filter(Boolean).slice(0, 5)
    : [];
  const redFlags = Array.isArray(parsed.redFlags) ? parsed.redFlags.map((item) => clip(item, 220)).filter(Boolean).slice(0, 5) : [];
  const confidence = ["low", "moderate", "high"].includes(String(parsed.confidence || "").toLowerCase())
    ? String(parsed.confidence).toLowerCase()
    : "moderate";
  const disclaimer = clip(
    parsed.disclaimer ||
      "Evidence support only. This output is not a diagnosis or prescribing instruction and must be interpreted in clinical context.",
    260
  );

  if (!summary) return null;

  return {
    summary,
    keyPoints,
    recommendations,
    redFlags,
    confidence,
    disclaimer,
  };
}

function buildCitationContext(citations, evidence) {
  const citationMap = new Map();
  for (const citation of citations.slice(0, 12)) {
    const id = citation.id || citation.pmid;
    if (!id) continue;
    citationMap.set(id, {
      id,
      source: citation.source || "Unknown",
      title: citation.title || "Untitled",
      year: citation.year || "Unknown",
      snippet: "",
    });
  }

  for (const item of evidence || []) {
    for (const id of item.citationIds || []) {
      if (citationMap.has(id) && !citationMap.get(id).snippet) {
        citationMap.get(id).snippet = clip(item.statement, 260);
      }
    }
  }

  return Array.from(citationMap.values());
}

async function generateStructuredAnswer({ question, citations, evidence }) {
  if (!env.enableLlmStructured) {
    console.log("[llm] LLM synthesis disabled");
    return null;
  }
  const resolvedApiKey = env.llmApiKey || env.groqApiKey;
  if (!resolvedApiKey || !env.llmModel) {
    return null;
  }

  const contextItems = buildCitationContext(citations || [], evidence || []);

  if (!contextItems.length) {
    return null;
  }

  try {
    const systemPrompt =
      "You are a clinical evidence synthesis assistant. Use only the provided trusted source context. Do not invent facts. If context is insufficient, say so clearly. Return only JSON.";

    const userPrompt = {
      task: "Create a concise structured clinical answer from trusted evidence context.",
      requirements: {
        style: "professional concise clinical",
        output_json_schema: {
          summary: "string",
          keyPoints: ["string"],
          recommendations: ["string"],
          redFlags: ["string"],
          confidence: "one of: low|moderate|high",
          disclaimer: "string",
        },
        constraints: [
          "Do not use knowledge outside supplied context",
          "Reference uncertainty when evidence is limited",
          "Do not include markdown",
        ],
      },
      question,
      context: contextItems,
    };

    const fullPrompt = `${systemPrompt}\n\n${JSON.stringify(userPrompt)}`;

    let content = "";

    const response = await axios.post(
      env.llmApiUrl,
      {
        model: env.llmModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPrompt) },
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      },
      {
        timeout: REQUEST_TIMEOUT,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resolvedApiKey}`,
        },
      }
    );

    content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsed = safeParseJson(content);
    if (!parsed) {
      return null;
    }

    const normalized = normalizeStructuredAnswer(parsed);
    if (!normalized) {
      return null;
    }

    return normalized;
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateStructuredAnswer,
};
