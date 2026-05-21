/**
 * Evidence Quality Analysis Service
 * Enriches evidence with quality scoring, GRADE classification,
 * and clinical decision support metrics
 */

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Score source credibility (0-100)
 * Higher score = more trustworthy for clinical decisions
 */
function scoreSourceCredibility(source) {
  let score = 50;

  // Source type weighting
  if (source.includes("PubMed") || source.includes("PMID")) {
    score += 30;
  }
  if (source.includes("ClinicalTrials") || source.includes("NCT")) {
    score += 20;
  }
  if (source.includes("FDA") || source.includes("openFDA")) {
    score += 15;
  }

  // Bonus for high-impact journals
  const highImpactJournals = [
    "The Lancet",
    "New England Journal of Medicine",
    "JAMA",
    "BMJ",
    "Nature",
    "Science",
    "Cell",
  ];
  if (highImpactJournals.some((j) => source.toLowerCase().includes(j.toLowerCase()))) {
    score += 20;
  }

  // Penalty for low-credibility sources
  if (source.includes("Nursing") || source.includes("blog") || source.includes("forum")) {
    score -= 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Classify evidence strength using GRADE methodology
 * (Grading of Recommendations Assessment, Development and Evaluation)
 */
function gradeEvidenceStrength(evidence) {
  const sourceCount = evidence?.length || 0;
  const hasClinicalTrials = evidence?.some((e) => e.source?.includes("ClinicalTrials"));
  const recentEvidence = evidence?.some((e) => {
    const year = parseInt(e.year) || CURRENT_YEAR;
    return CURRENT_YEAR - year <= 3;
  });

  // GRADE: High → Moderate → Low → Very Low
  if (sourceCount >= 5 && hasClinicalTrials && recentEvidence) {
    return "High";
  } else if (sourceCount >= 3 && recentEvidence) {
    return "Moderate";
  } else if (sourceCount >= 2) {
    return "Low";
  }
  return "Very Low";
}

/**
 * Detect evidence recency and generate alerts
 */
function getEvidenceRecencyAlert(evidence) {
  if (!evidence || evidence.length === 0) return null;

  const yearsOld = evidence.map((e) => {
    const year = parseInt(e.year);
    return isNaN(year) ? null : CURRENT_YEAR - year;
  });

  const avgAge = yearsOld.filter((y) => y !== null).reduce((a, b) => a + b, 0) / yearsOld.filter((y) => y !== null).length;

  if (avgAge > 10) {
    return {
      severity: "high",
      message: `Evidence is outdated (avg ${Math.round(avgAge)} years old). Recent clinical guidelines should be consulted.`,
    };
  } else if (avgAge > 5) {
    return {
      severity: "medium",
      message: `Some evidence is older (avg ${Math.round(avgAge)} years). Check for newer studies.`,
    };
  }

  const newestYear = Math.max(...yearsOld.filter((y) => y !== null));
  if (newestYear <= 2) {
    return {
      severity: "low",
      message: `Recent evidence available (${CURRENT_YEAR - newestYear} year old study).`,
      isPositive: true,
    };
  }

  return null;
}

/**
 * Analyze evidence for gaps and conflicts
 */
function analyzeEvidenceGaps(evidence) {
  const gaps = [];
  const conflicts = [];

  if (!evidence || evidence.length === 0) {
    gaps.push("No direct evidence found. Consider expert opinion or clinical experience.");
  } else if (evidence.length < 3) {
    gaps.push("Limited evidence base. More research may be available in meta-analyses or systematic reviews.");
  }

  // Detect potential conflicts (simplified)
  const hasConflictKeywords = evidence.some((e) => {
    const text = (e.statement || "").toLowerCase();
    return (text.includes("no significant") || text.includes("not found")) && evidence.some((e2) => (e2.statement || "").toLowerCase().includes("significantly"));
  });

  if (hasConflictKeywords) {
    conflicts.push("Mixed evidence: Some studies show significance while others do not. Effect size may be small or context-dependent.");
  }

  return { gaps, conflicts };
}

/**
 * Generate risk-benefit assessment framework
 */
function generateRiskBenefitFramework(question) {
  // Detect if question is about treatments/interventions
  const treatmentKeywords = ["treatment", "therapy", "drug", "medication", "surgery", "procedure", "intervention"];
  const isTreatmentQuestion = treatmentKeywords.some((k) => question.toLowerCase().includes(k));

  if (!isTreatmentQuestion) return null;

  return {
    framework: "Risk-Benefit Analysis",
    recommendations: [
      "Weigh potential benefits against known risks",
      "Consider individual patient factors (age, comorbidities, contraindications)",
      "Discuss with patient before implementing",
      "Monitor for adverse effects during treatment",
      "Review alternatives if risks outweigh benefits",
    ],
  };
}

/**
 * Enrich evidence response with quality metrics
 */
function enrichEvidenceResponse(response, citations, evidence) {
  if (!response) {
    return response;
  }

  const enriched = { ...response };

  // Add GRADE evidence strength
  enriched.evidenceStrength = gradeEvidenceStrength(evidence);

  // Add source credibility scores
  if (citations && citations.length > 0) {
    enriched.sourceCredibility = citations.slice(0, 5).map((c) => ({
      id: c.id || c.pmid,
      title: c.title,
      credibilityScore: scoreSourceCredibility(c.source || "Unknown"),
      source: c.source,
    }));
  }

  // Add recency alert
  const recencyAlert = getEvidenceRecencyAlert(citations);
  if (recencyAlert) {
    enriched.recencyAlert = recencyAlert;
  }

  // Add evidence gap analysis
  const { gaps, conflicts } = analyzeEvidenceGaps(evidence);
  if (gaps.length > 0 || conflicts.length > 0) {
    enriched.evidenceAnalysis = { gaps, conflicts };
  }

  // Add risk-benefit framework if applicable
  const rbFramework = generateRiskBenefitFramework(
    response.question || ""
  );
  if (rbFramework) {
    enriched.riskBenefitFramework = rbFramework;
  }

  return enriched;
}

module.exports = {
  enrichEvidenceResponse,
  scoreSourceCredibility,
  gradeEvidenceStrength,
  getEvidenceRecencyAlert,
  analyzeEvidenceGaps,
  generateRiskBenefitFramework,
};
