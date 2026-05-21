# jubilant Clinical Q&A (MERN)

A professional MERN web app for clinicians to ask focused medical questions and get concise, **evidence-graded answers** from trusted medical sources in under **6 seconds**.

## ✨ What Makes This Standout

### 1. **Evidence Quality Scoring** 
Every source is rated for credibility (0-100) based on journal impact, publication type, and recency. Doctors see *why* evidence is trustworthy.

### 2. **GRADE Evidence Classification** 
Medical gold standard: High/Moderate/Low/Very Low confidence. Auto-calculated based on number of studies, types, consistency, and recency.

### 3. **Risk-Benefit Analysis Framework** 
For treatment questions, auto-generates structured checklist: benefits vs risks, patient factors, monitoring plan, alternatives.

### 4. **Comparative Treatment Analysis** 
Detects "Drug A vs B?" questions and auto-generates decision matrix with efficacy, safety, cost, accessibility, patient preference weighting.

### 5. **Gemini 2.0 LLM Synthesis**
Structures raw evidence into clinical summaries with key points, recommendations, red flags, and confidence levels.

---

## What This Does

- Accepts a clinical question from a doctor-friendly web interface
- Queries **PubMed only** (trustworthy sources, no newspapers)
- Retrieves trial records from ClinicalTrials.gov API v2
- Retrieves regulatory drug information from openFDA
- **Enriches evidence** with quality metrics and decision frameworks
- Synthesizes answers using Gemini LLM (trusted context only, no hallucinations)
- Returns structured citations with credibility scores
- Delivers answers in <6 seconds

## Tech Stack

- **Backend**: Express.js + Node.js
- **Frontend**: React + Vite
- **LLM**: Google Gemini 2.0 Flash
- **APIs**: PubMed, ClinicalTrials.gov, openFDA
- **Database**: MongoDB (optional)
- **Architecture**: Microservices (evidence, quality, comparative analysis)

## Project Structure

```
src/
  ├── controllers/
  │   └── qa.controller.js (orchestrates entire pipeline)
  ├── services/
  │   ├── pubmed.service.js (evidence retrieval)
  │   ├── evidence.service.js (synthesis)
  │   ├── trusted-sources.service.js (CT.gov, FDA)
  │   ├── llm-structured.service.js (Gemini integration)
  │   ├── evidence-quality.service.js (GRADE, credibility) ✨
  │   └── comparative-analysis.service.js (treatment comparison) ✨
  ├── config/
  │   ├── db.js
  │   └── env.js
  └── models/
      └── QueryLog.js
client/ (React + Vite frontend)
```

## Quick Start

1. Install dependencies:

```bash
npm install
npm --prefix client install
```

2. Configure environment:

```bash
# Create .env from .env.example
cp .env.example .env

# Add your Gemini API key
echo "LLM_API_KEY=your_gemini_key" >> .env
```

3. Run development (API + frontend):

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## Example API Response

```json
{
  "answer": "Asthma guidelines were updated...",
  "structuredAnswer": {
    "summary": "Children with persistent symptoms despite Step 4 therapy should see a specialist.",
    "keyPoints": ["New biologics available", "Adherence is critical"],
    "recommendations": ["Refer to specialist", "Consider biologics"],
    "redFlags": ["Uncontrolled symptoms despite treatment"],
    "confidence": "high",
    "evidenceStrength": "High",
    "sourceCredibility": [
      {
        "id": "PMID:34655640",
        "credibilityScore": 85,
        "source": "Journal of allergy and clinical immunology"
      }
    ],
    "recencyAlert": {
      "severity": "low",
      "message": "Recent evidence available (1 year old study)",
      "isPositive": true
    },
    "evidenceAnalysis": {
      "gaps": ["Limited data on long-term outcomes"],
      "conflicts": []
    },
    "riskBenefitFramework": {
      "framework": "Risk-Benefit Analysis",
      "recommendations": ["Discuss benefits vs risks with patient", "Monitor for side effects"]
    }
  },
  "clinicalDecisionSupport": {
    "comparisonReport": {
      "decisionMatrix": {
        "criteria": [
          { "name": "Efficacy", "weight": 0.3 },
          { "name": "Safety", "weight": 0.25 }
        ]
      }
    }
  },
  "meta": {
    "source": "PubMed + ClinicalTrials.gov + openFDA",
    "latencyMs": 5234,
    "qualityEnhancement": "Evidence quality analysis enabled"
  }
}
```

---

## Configuration

### Environment Variables

```env
# API Server
PORT=5000
NODE_ENV=development

# Frontend
CLIENT_ORIGIN=http://localhost:5173

# Medical Data
PUBMED_EMAIL=your-email@example.com
PUBMED_TOOL=jubilantClinicalQA
ENABLE_CLINICAL_TRIALS=true
ENABLE_OPENFDA=true

# LLM (Gemini)
ENABLE_LLM_STRUCTURED=true
LLM_API_KEY=your_gemini_api_key
LLM_MODEL=gemini-2.0-flash
LLM_API_URL=https://generativelanguage.googleapis.com/v1beta/models

# Database (Optional - logs queries if configured)
MONGODB_URI=mongodb://localhost:27017/jubilant
```

---

## For Interviews

See [INTERVIEW_PREP.md](INTERVIEW_PREP.md) for:
- Architecture diagrams
- Design decision rationale
- Key talking points
- Scaling strategy
- Technical strengths

See [API_FEATURES.md](API_FEATURES.md) for:
- Complete API documentation
- Feature deep-dives
- Competitive analysis
- Sample demo questions

---

## Development

```bash
# Install dependencies
npm install && npm --prefix client install

# Run dev servers (auto-restart on changes)
npm run dev

# Run backend only
npm run dev:server

# Run frontend only
npm run dev:client

# Build for production
npm run build
npm run build:client
```

---

## Response Time Optimization

- **Parallel API calls**: PubMed, Clinical Trials, FDA called simultaneously
- **Timeouts**: Each source times out at 2s, continues with partial results
- **Fallback**: If LLM slow, returns heuristic answer
- **In-memory caching**: Same question asked twice returns instantly
- **Lean responses**: Only essential fields in JSON

Target: <6 seconds for full synthesis (retrieval + LLM + enrichment)

---

## The Problem This Solves

Doctors have limited time and need:
✅ Fast answers (<2 minutes)
✅ Trustworthy sources only (PubMed, not random websites)
✅ Evidence grading (GRADE levels, not just "we found 5 studies")
✅ Decision frameworks (how do I choose between treatments?)
✅ Clear citations (what journal? which study?)

jubilant delivers all five.
- API: http://localhost:5000

## Build for production

```bash
npm run build
npm start
```

## API Endpoint

### `POST /api/medical/ask`

Request:

```json
{
  "question": "In adults with type 2 diabetes, does semaglutide reduce cardiovascular events compared with placebo?",
  "maxArticles": 8
}
```

Response includes:

- `answer` concise evidence summary
- `evidence[]` key extracted statements + source references
- `citations[]` source, identifier, title, journal, year, source URL
- `meta` source, retrieval count, latency, timestamp

## Reliability Notes

- Trusted sources are PubMed, ClinicalTrials.gov, and openFDA only
- This is evidence support, not diagnosis or prescribing advice
- Clinicians should verify in full-text guideline context and patient-specific factors
