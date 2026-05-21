# jubilant Clinical QA API Documentation

## Overview
Fast, evidence-based clinical Q&A system for doctors. Powered by PubMed, Clinical Trials, and Gemini LLM with advanced clinical decision support.

**Response Time:** <6 seconds | **Evidence Sources:** PubMed only | **Medical Standards:** GRADE scoring, Evidence Quality Analysis

---

## Core Features

### 1. **Trusted Evidence Retrieval** ✓
- **PubMed Integration**: Latest peer-reviewed evidence only
- **Clinical Trials**: Real-world trial data via ClinicalTrials.gov
- **FDA Data**: Drug approvals, warnings, and status tracking

### 2. **Evidence Quality Analysis** ⭐ (Standout Feature)
Every response includes:

```json
{
  "evidenceStrength": "High|Moderate|Low|Very Low",
  "sourceCredibility": [
    {
      "id": "PMID:34655640",
      "title": "Article Title",
      "credibilityScore": 85,
      "source": "The Journal of allergy and clinical immunology"
    }
  ],
  "recencyAlert": {
    "severity": "low|medium|high",
    "message": "Recent evidence available (1 year old study)",
    "isPositive": true
  },
  "evidenceAnalysis": {
    "gaps": ["Limited evidence base..."],
    "conflicts": ["Mixed evidence: Some studies..."]
  }
}
```

**How It Works:**
- **GRADE Scoring**: Classifies evidence strength based on source count, trial data, and recency
- **Credibility Scoring**: Each source rated 0-100 based on journal impact, publication type
- **Recency Alerts**: Flags outdated evidence (>10 years) or highlights recent studies (<2 years)
- **Gap Detection**: Identifies when evidence is insufficient for confident recommendations

---

### 3. **Risk-Benefit Analysis Framework** ⭐ (Standout Feature)
For treatment/intervention questions:

```json
{
  "riskBenefitFramework": {
    "framework": "Risk-Benefit Analysis",
    "recommendations": [
      "Weigh potential benefits against known risks",
      "Consider individual patient factors (age, comorbidities)",
      "Discuss with patient before implementing",
      "Monitor for adverse effects during treatment",
      "Review alternatives if risks outweigh benefits"
    ]
  }
}
```

---

### 4. **Comparative Treatment Analysis** ⭐ (Standout Feature)
When comparing options (Drug A vs B, Surgery vs Conservative):

```json
{
  "clinicalDecisionSupport": {
    "comparisonReport": {
      "isComparativeQuestion": true,
      "comparisonType": "Treatment Options",
      "decisionMatrix": {
        "framework": "Clinical Decision Matrix",
        "criteria": [
          { "name": "Efficacy", "weight": 0.3 },
          { "name": "Safety", "weight": 0.25 },
          { "name": "Accessibility", "weight": 0.2 },
          { "name": "Cost-effectiveness", "weight": 0.15 },
          { "name": "Patient Preference", "weight": 0.1 }
        ]
      },
      "specialConsiderations": {
        "applicablePopulations": ["pediatric", "geriatric"],
        "potentialContraindications": ["Not recommended in pregnancy"],
        "disclaimer": "This analysis should inform clinical judgment, not replace it."
      }
    }
  }
}
```

---

### 5. **LLM-Powered Synthesis** ✓
Gemini 2.0 Flash structures raw evidence into:
- Concise clinical summary
- Key evidence points
- Actionable recommendations
- Red flags and warnings
- Evidence confidence level

---

## API Endpoints

### POST `/api/medical/ask`

**Request:**
```json
{
  "question": "In adults with community-acquired pneumonia, does procalcitonin-guided therapy reduce antibiotic duration?",
  "maxArticles": 8
}
```

**Response:**
```json
{
  "answer": "Clinical answer synthesized by LLM...",
  "structuredAnswer": {
    "summary": "Evidence-based clinical summary",
    "keyPoints": ["Key finding 1", "Key finding 2"],
    "recommendations": ["Recommendation 1"],
    "redFlags": ["Alert 1"],
    "confidence": "high|moderate|low",
    "disclaimer": "Medical evidence disclaimer",
    "evidenceStrength": "High",
    "sourceCredibility": [
      {
        "id": "PMID:34655640",
        "title": "Article",
        "credibilityScore": 85,
        "source": "Journal Name"
      }
    ],
    "recencyAlert": {
      "severity": "low",
      "message": "Recent evidence available",
      "isPositive": true
    },
    "evidenceAnalysis": {
      "gaps": [],
      "conflicts": []
    },
    "riskBenefitFramework": {
      "framework": "Risk-Benefit Analysis",
      "recommendations": [...]
    }
  },
  "clinicalDecisionSupport": {
    "comparisonReport": {
      "isComparativeQuestion": true,
      "decisionMatrix": {...}
    }
  },
  "citations": [
    {
      "id": "PMID:34655640",
      "pmid": "34655640",
      "title": "Article Title",
      "source": "PubMed",
      "year": 2021
    }
  ],
  "evidence": [
    {
      "statement": "Key finding from research",
      "citationIds": ["34655640"],
      "source": "PubMed"
    }
  ],
  "meta": {
    "source": "PubMed + ClinicalTrials.gov + openFDA",
    "retrievedArticles": 12,
    "retrievedTrustedSources": 5,
    "answerGenerator": "LLM (trusted-context only)",
    "qualityEnhancement": "Evidence quality analysis enabled",
    "latencyMs": 5234,
    "retrievedAt": "2024-05-10T15:30:00Z"
  }
}
```

---

## Interview Talking Points

### ✨ What Makes This Standout:

1. **Evidence Quality Scoring** - Not just finding sources, but rating their credibility scientifically
   - Higher scores for peer-reviewed journals, recent studies, clinical trials
   - Transparency: doctors see *why* a source is trusted

2. **GRADE Evidence Classification** - Uses medical gold standard for evidence grading
   - High/Moderate/Low/Very Low confidence
   - Helps doctors understand certainty of recommendations

3. **Risk-Benefit Framework** - Addresses decision-making burden
   - Structured checklist for comparing treatments
   - Clinical decision matrix for systematic evaluation
   - Special population alerts (pregnancy, pediatrics, elderly)

4. **Comparative Analysis** - Autodetects when doctors need to compare options
   - Extracts advantages/disadvantages from evidence
   - Flags contraindications automatically
   - Decision matrix for weighted scoring

5. **Pragmatic Design**
   - Works without MongoDB (decentralized, scalable)
   - Gemini integration reduces costs vs GPT-4
   - Graceful degradation when LLM unavailable
   - Sub-6-second responses for clinical time constraints

---

## Technical Stack

- **Backend**: Express.js + Node.js
- **Frontend**: React + Vite
- **LLM**: Google Gemini 2.0 Flash
- **Medical Data**: PubMed API, ClinicalTrials.gov, FDA API
- **Deployment**: Ready for Docker/Cloud

---

## Competitive Advantages

| Feature | jubilant | UpToDate | Medscape |
|---------|-----------|----------|----------|
| **Speed** | <6s | Requires subscription | Ads-heavy |
| **Evidence Only** | ✓ PubMed-only | ✓ Curated | ✓ Multiple sources |
| **Quality Scoring** | ✓ GRADE + Credibility | ✗ Not transparent | ✗ Not published |
| **Decision Support** | ✓ Risk-Benefit + Matrix | ✗ Limited | ✗ None |
| **Cost** | Open source | $$$$ Subscription | Free (Ad-supported) |

---

## Sample Questions to Demo

1. **Simple**: "How do I treat asthma in children?"
2. **Comparative**: "What's the difference between prednisone and dexamethasone for inflammation?"
3. **Evidence Gap**: "What's the latest on XXL dose medications?"
4. **Special Population**: "How safe is Drug X during pregnancy?"

Each will showcase different standout features in the response.

---

## Future Enhancements

- [ ] Multi-language support (Spanish, Mandarin for global reach)
- [ ] Integration with EHR systems (Epic, Cerner)
- [ ] Real-time PubMed alerts for new studies
- [ ] Differential diagnosis helper
- [ ] Drug interaction checker
- [ ] Patient education summaries

---

**Built for doctors, by evidence. Fast, trustworthy, clinical-grade.**
