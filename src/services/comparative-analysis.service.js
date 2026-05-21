/**
 * Comparative Treatment Analysis Service
 * Helps clinicians compare different treatment options with evidence metrics
 * Useful for: Drug A vs Drug B, Surgery vs Conservative Management, etc.
 */

/**
 * Analyze comparative advantages and disadvantages
 */
function analyzeComparativeOptions(evidence) {
  if (!evidence || evidence.length === 0) return null;

  const options = {};

  // Extract treatment options mentioned in evidence
  for (const item of evidence) {
    const text = (item.statement || "").toLowerCase();

    // Simple extraction - in production, would use NLP
    if (text.includes("versus") || text.includes("vs") || text.includes("compared")) {
      const parts = text.split(/(versus|vs|compared to|compared with)/i);
      if (parts.length > 1) {
        const option1 = parts[0].trim().slice(-20);
        const option2 = parts[1].trim().slice(0, 20);

        if (!options[option1]) options[option1] = { advantages: [], disadvantages: [] };
        if (!options[option2]) options[option2] = { advantages: [], disadvantages: [] };
      }
    }

    // Extract advantages/disadvantages
    if (text.includes("superior") || text.includes("better") || text.includes("more effective")) {
      const option = text.split(/superior|better|more effective/)[0].trim().slice(-15);
      if (options[option]) options[option].advantages.push(item.statement);
    }

    if (text.includes("inferior") || text.includes("worse") || text.includes("less effective")) {
      const option = text.split(/inferior|worse|less effective/)[0].trim().slice(-15);
      if (options[option]) options[option].disadvantages.push(item.statement);
    }
  }

  return Object.keys(options).length > 0 ? options : null;
}

/**
 * Generate decision support matrix
 * Helps doctors systematically evaluate options
 */
function generateDecisionMatrix(question, evidence) {
  const criteria = [
    { name: "Efficacy", weight: 0.3, description: "How well does it work?" },
    { name: "Safety", weight: 0.25, description: "What are the side effects?" },
    { name: "Accessibility", weight: 0.2, description: "Is it widely available?" },
    { name: "Cost-effectiveness", weight: 0.15, description: "Is it economically viable?" },
    { name: "Patient Preference", weight: 0.1, description: "What does patient prefer?" },
  ];

  return {
    framework: "Clinical Decision Matrix",
    instructions: [
      "Rate each option on each criterion (1-5 scale)",
      "Apply weights to calculate final score",
      "Document justification for ratings",
      "Consider patient factors and contraindications",
      "Discuss final recommendation with patient",
    ],
    criteria,
    template: {
      options: ["Option 1", "Option 2", "Option 3"],
      matrix: [
        { criterion: "Efficacy", score1: 0, score2: 0, score3: 0 },
        { criterion: "Safety", score1: 0, score2: 0, score3: 0 },
        { criterion: "Accessibility", score1: 0, score2: 0, score3: 0 },
        { criterion: "Cost-effectiveness", score1: 0, score2: 0, score3: 0 },
        { criterion: "Patient Preference", score1: 0, score2: 0, score3: 0 },
      ],
      weightedScores: [0, 0, 0],
    },
  };
}

/**
 * Identify clinical contraindications and special populations
 */
function identifySpecialPopulations(evidence) {
  const populations = new Set();
  const contraindications = new Set();

  const keywords = {
    pregnancy: ["pregnant", "pregnancy", "perinatal", "fetal"],
    pediatric: ["children", "pediatric", "infants", "newborn"],
    geriatric: ["elderly", "older adults", "geriatric", "aged"],
    renal: ["renal failure", "kidney disease", "CKD"],
    hepatic: ["liver disease", "cirrhosis", "hepatic"],
    cardiac: ["heart disease", "cardiac", "myocardial"],
    contraindicated: ["contraindicated", "avoid", "not recommended"],
  };

  for (const item of evidence || []) {
    const text = (item.statement || "").toLowerCase();

    for (const [popKey, terms] of Object.entries(keywords)) {
      for (const term of terms) {
        if (text.includes(term)) {
          if (popKey === "contraindicated") {
            contraindications.add(item.statement);
          } else {
            populations.add(popKey);
          }
        }
      }
    }
  }

  return {
    specialPopulations: Array.from(populations),
    contraindications: Array.from(contraindications),
  };
}

/**
 * Generate a structured comparison report
 */
function generateComparisonReport(question, evidence, citations) {
  const isComparativeQuestion =
    question.toLowerCase().includes("versus") ||
    question.toLowerCase().includes("vs") ||
    question.toLowerCase().includes("compare") ||
    question.toLowerCase().includes("better") ||
    question.toLowerCase().includes("difference");

  if (!isComparativeQuestion) return null;

  const options = analyzeComparativeOptions(evidence);
  const matrix = generateDecisionMatrix(question, evidence);
  const { specialPopulations, contraindications } = identifySpecialPopulations(evidence);

  return {
    isComparativeQuestion: true,
    comparisonType: "Treatment Options",
    reportType: "Comparative Analysis",
    options,
    decisionMatrix: matrix,
    specialConsiderations: {
      applicablePopulations: specialPopulations,
      potentialContraindications: contraindications,
      disclaimer: "This analysis should inform clinical judgment, not replace it. Always consider individual patient factors.",
    },
    recommendation: {
      instruction: "Synthesize evidence above, apply clinical judgment, and discuss with patient before decision.",
      considerations: [
        "Patient age, comorbidities, and preferences",
        "Local availability and cost constraints",
        "Evidence quality and recency",
        "Your clinical experience and expertise",
      ],
    },
  };
}

module.exports = {
  generateComparisonReport,
  generateDecisionMatrix,
  analyzeComparativeOptions,
  identifySpecialPopulations,
};
