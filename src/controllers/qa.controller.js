const mongoose = require("mongoose");
const QueryLog = require("../models/QueryLog");
const { searchPubMedIds, fetchPubMedArticles } = require("../services/pubmed.service");
const { buildEvidenceAnswer } = require("../services/evidence.service");
const { fetchTrustedSources } = require("../services/trusted-sources.service");
const { generateStructuredAnswer } = require("../services/llm-structured.service");
const { enrichEvidenceResponse } = require("../services/evidence-quality.service");
const { generateComparisonReport } = require("../services/comparative-analysis.service");
const env = require("../config/env");

async function askMedicalQuestion(req, res, next) {
  try {
    const startedAt = Date.now();
    const { question, maxArticles } = req.body || {};

    if (!question || typeof question !== "string" || question.trim().length < 10) {
      return res.status(400).json({
        message: "Please provide a clear medical question (minimum 10 characters).",
      });
    }

    const normalizedQuestion = question.trim();
    const pmids = await searchPubMedIds(normalizedQuestion, Number(maxArticles || 8));
    const articles = await fetchPubMedArticles(pmids);

    const trustedSources =
      env.enableClinicalTrials || env.enableOpenFda
        ? await fetchTrustedSources(normalizedQuestion, {
            includeClinicalTrials: env.enableClinicalTrials,
            includeOpenFda: env.enableOpenFda,
          })
        : [];

    const synthesized = await buildEvidenceAnswer(normalizedQuestion, articles, trustedSources);
    
    const structuredAnswer = await generateStructuredAnswer({
      question: normalizedQuestion,
      citations: synthesized.citations,
      evidence: synthesized.evidence,
    }).catch((err) => {
      console.error("[controller] LLM Error:", err.message);
      return null;
    });

    const finalAnswer = structuredAnswer?.summary || synthesized.answer;
    const latencyMs = Date.now() - startedAt;

    // Enrich response with quality analysis, GRADE scoring, and clinical insights
    const enrichedStructuredAnswer = structuredAnswer
      ? enrichEvidenceResponse(structuredAnswer, synthesized.citations, synthesized.evidence)
      : null;

    // Add comparative analysis if the question compares treatments
    const comparisonReport = generateComparisonReport(
      normalizedQuestion,
      synthesized.evidence,
      synthesized.citations
    );

    if (mongoose.connection.readyState === 1) {
      QueryLog.create({
        question: normalizedQuestion,
        answer: finalAnswer,
        citationPmids: synthesized.citations.map((item) => item.pmid),
        citationIds: synthesized.citations.map((item) => item.id),
        latencyMs,
      }).catch(() => undefined);
    }

    const response = {
      ...synthesized,
      answer: finalAnswer,
      structuredAnswer: enrichedStructuredAnswer || structuredAnswer,
      meta: {
        source: "PubMed + ClinicalTrials.gov + openFDA",
        retrievedArticles: articles.length,
        retrievedTrustedSources: trustedSources.length,
        answerGenerator: structuredAnswer ? "LLM (trusted-context only)" : "Heuristic extractor",
        qualityEnhancement: structuredAnswer ? "Evidence quality analysis enabled" : "N/A",
        latencyMs,
        retrievedAt: new Date().toISOString(),
      },
    };

    // Include comparative analysis if detected
    if (comparisonReport) {
      response.clinicalDecisionSupport = {
        comparisonReport,
      };
    }

    return res.status(200).json(response);
  } catch (error) {
    return next(error);
  }
}

module.exports = { askMedicalQuestion };
