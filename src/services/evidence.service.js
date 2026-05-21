const { sentenceSplit } = require("../utils/text.util");
const { getExtractor, getDenseEmbedding, calculateCosineSimilarity } = require("./embedding.service");

function sourceWeight(sourceType) {
  if (sourceType === "trial-registry") return 3;
  if (sourceType === "regulatory") return 2;
  return 1;
}

function toCitationId(source, rawId) {
  const prefix = source === "PubMed" ? "PMID" : source.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${prefix}:${rawId}`;
}

async function buildEvidenceAnswer(question, articles, trustedSources = []) {
  const pubMedCitations = articles.map((article) => ({
    id: toCitationId("PubMed", article.pmid),
    pmid: article.pmid,
    source: "PubMed",
    title: article.title,
    journal: article.journal || "Unknown journal",
    year: article.year || "Unknown",
    url: article.url,
  }));

  const externalCitations = trustedSources.map((item) => ({
    id: item.id,
    source: item.source,
    title: item.title,
    journal: item.journal || item.source,
    year: item.year || "Unknown",
    url: item.url,
  }));

  const citations = [...pubMedCitations, ...externalCitations];

  if (!citations.length) {
    return {
      answer:
        "No trusted evidence records were returned for this exact query. Try a narrower question with disease, intervention, and population terms.",
      evidence: [],
      citations: [],
    };
  }

  const extractor = await getExtractor();
  const queryEmbedding = await getDenseEmbedding(question, extractor);
  
  const sentenceCandidates = [];

  const normalizedPubMed = articles.slice(0, 6).map((article) => ({
    source: "PubMed",
    sourceType: "literature",
    id: toCitationId("PubMed", article.pmid),
    pmid: article.pmid,
    abstract: article.abstract,
    title: article.title,
  }));

  const normalizedTrusted = trustedSources.slice(0, 4).map((item) => ({
    source: item.source,
    sourceType: item.sourceType,
    id: item.id,
    abstract: item.abstract,
    title: item.title,
  }));

  const evidenceDocs = [...normalizedPubMed, ...normalizedTrusted];

  for (const article of evidenceDocs) {
    const sentences = sentenceSplit(article.abstract || article.title);

    for (const sentence of sentences) {
      if (!sentence) continue;
      
      const sentenceEmbedding = await getDenseEmbedding(sentence, extractor);
      const similarity = calculateCosineSimilarity(queryEmbedding, sentenceEmbedding);
      
      // Filter out entirely unrelated sentences early
      if (similarity < 0.2) continue;

      let sentenceScore = similarity * 10 + sourceWeight(article.sourceType);
      
      // Clinical Booster: Favor high-quality evidence types mathematically
      if (/(randomized|meta-analysis|systematic review|guideline|cohort|trial)/i.test(sentence)) {
        sentenceScore += 2;
      }

      if (sentenceScore < 4) continue;

      sentenceCandidates.push({
        sentence,
        citationId: article.id,
        pmid: article.pmid,
        source: article.source,
        score: sentenceScore,
      });
    }
  }

  sentenceCandidates.sort((a, b) => b.score - a.score);

  const selected = [];
  const seen = new Set();

  for (const item of sentenceCandidates) {
    const key = item.sentence.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(item);
    if (selected.length === 3) break;
  }

  const evidence = selected.map((item) => ({
    statement: item.sentence,
    citationIds: [item.citationId],
    citationPmids: item.pmid ? [item.pmid] : [],
    source: item.source,
  }));

  const answer =
    selected.length > 0
      ? selected.map((item) => item.sentence).join(" ")
      : "Evidence was identified in PubMed records, but no concise abstract sentence could be extracted. Review the citations below.";

  return {
    answer,
    evidence,
    citations,
  };
}

module.exports = { buildEvidenceAnswer };
