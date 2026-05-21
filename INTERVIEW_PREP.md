# jubilant Interview Prep Guide

## The Problem You're Solving

**Challenge**: Doctors need fast, trustworthy answers to clinical questions from *only* reliable sources (PubMed), with proper evidence grading and decision support—all in under 2 minutes.

**Solution**: A full-stack MERN app that synthesizes evidence with medical-grade quality metrics and decision frameworks.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                            │
│  (Vite - Fast builds, HMR, optimized bundle)                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────────────┐
│                  Express.js Backend (Port 5000)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  QA Controller: orchestrates request pipeline            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                               │                                 │
│         ┌─────────────────────┼─────────────────────┐          │
│         ↓                     ↓                     ↓          │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ PubMed Service │  │ Trusted      │  │ LLM Structured   │  │
│  │ (searchIds,    │  │ Sources      │  │ Service          │  │
│  │  fetchArticles)│  │ (CT.gov, FDA)│  │ (Gemini 2.0)     │  │
│  └────────────────┘  └──────────────┘  └──────────────────┘  │
│         │                                         │            │
│         └─────────────────────┬───────────────────┘            │
│                               ↓                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Evidence Quality Service (NEW - Standout!)             │   │
│  │ • GRADE scoring                                        │   │
│  │ • Source credibility analysis                          │   │
│  │ • Recency detection                                    │   │
│  │ • Gap & conflict analysis                              │   │
│  └────────────────────────────────────────────────────────┘   │
│                               │                                │
│                               ↓                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Comparative Analysis Service (NEW - Standout!)         │   │
│  │ • Treatment comparison detection                       │   │
│  │ • Decision matrix generation                           │   │
│  │ • Risk-benefit framework                               │   │
│  │ • Special population alerts                            │   │
│  └────────────────────────────────────────────────────────┘   │
│                               │                                │
│                               ↓                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ JSON Response with all enrichments                      │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       ↓                                               ↓
┌─────────────────────────────────┐  ┌──────────────────────────┐
│  External APIs (No Local Cache) │  │  Google Gemini API       │
│  • PubMed (NCBI)               │  │  (LLM Synthesis)         │
│  • ClinicalTrials.gov          │  │                          │
│  • FDA Drug Database            │  │  $0.075/1M input tokens  │
└─────────────────────────────────┘  └──────────────────────────┘
```

---

## Data Flow: From Query to Answer

```
1. User submits: "What's best for asthma: albuterol or salbutamol?"
                      │
                      ↓
2. PubMed Search    → Find 10-15 relevant articles
                      │
                      ↓
3. Fetch Articles   → Get full metadata + abstracts
                      │
                      ↓
4. Fetch Trusted    → Clinical trials & FDA data
   Sources            │
                      ↓
5. Build Evidence   → Synthesize into key points
   Answer             │
                      ↓
6. Gemini LLM       → Structure into clinical summary
   (Trusted context   │
    only)             ↓
                      ↓
7. QUALITY ENHANCE  → ADD GRADE scoring
   (Standout!)        → ADD credibility scores
                      → ADD recency alerts
                      → ADD gap/conflict analysis
                      │
                      ↓
8. COMPARISON       → DETECT "vs" question
   ANALYSIS          → ADD decision matrix
   (Standout!)       → ADD risk-benefit framework
                      │
                      ↓
9. Response         → Rich JSON with all enrichments
   (< 6 seconds)      │
                      ↓
10. Display         → React UI shows:
    Frontend          • Clinical answer
                      • Key evidence
                      • Quality metrics
                      • Decision tools
```

---

## Key Design Decisions & Why

### 1. **PubMed-Only Evidence**
**Why?** 
- Solves the "unreliable sources" problem (newspapers, random websites)
- Peer-reviewed only = trustworthy for doctors
- Trade-off: Slightly longer retrieval time (5-6s) worth it for quality

**Interview Answer**: "We chose to be opinionated about sources rather than generic. Doctors explicitly want PubMed-only because they trust peer review. This is a feature, not a limitation."

### 2. **Gemini 2.0 Flash Instead of GPT-4**
**Why?**
- Cost: $0.075/1M tokens vs $3/1M for GPT-4o (40x cheaper)
- Speed: Faster inference for <6s response time
- Quality: Still excellent for clinical summarization
- Medical context: Trained on medical literature

**Interview Answer**: "Smart resource allocation. For structured synthesis from provided context, Gemini is perfect. We save 40x on costs while maintaining quality."

### 3. **No MongoDB for Core Functionality**
**Why?**
- Problem statement focuses on *getting answers*, not storing them
- Query logging is optional, not essential
- Simpler deployment (stateless)
- Scales better (no database bottleneck)

**Interview Answer**: "We avoided the temptation to over-engineer. The core problem is answering questions *fast*, not building a query database. If a hospital needs logging, they can add it later."

### 4. **Structured JSON Response (not just text)**
**Why?**
- Frontend can format/highlight differently
- Programmatic access to evidence quality scores
- Integration-friendly (other apps can use the API)
- Enables decision support tools (matrix, frameworks)

---

## Standout Features Explained

### Feature 1: Evidence Quality Scoring
```
What makes this special?
- Not every paper is equally trustworthy
- We score each source 0-100 based on:
  * Journal impact (Nature = higher than unknown journal)
  * Publication type (RCT > observational > review)
  * Recency (recent studies weighted higher)
  
Doctor sees: "This evidence is from high-impact journals (avg score 82/100)"
vs. generic "5 sources found"
```

### Feature 2: GRADE Classification
```
Medical standard: GRADE evidence levels
- High: High confidence, apply to most patients
- Moderate: Moderate confidence, reasonable for most
- Low: Limited confidence, consider alternatives
- Very Low: Very limited confidence, weak recommendation

jubilant auto-classifies based on:
- Number of studies (more = higher confidence)
- Study types (RCTs > observational)
- Consistency (do they agree?)
- Recency (within 5 years = fresh)

This is WHAT DOCTORS ACTUALLY NEED but most apps don't provide.
```

### Feature 3: Risk-Benefit Framework
```
For treatment questions, auto-generate checklist:
1. Weigh benefits against risks
2. Consider patient factors (age, kidney function, pregnancy)
3. Discuss with patient
4. Monitor for side effects
5. Have backup plan

Converts abstract evidence into actionable decisions.
```

### Feature 4: Comparative Analysis
```
Detects: "Drug A vs Drug B?" or "Surgery vs Conservative?"

Auto-generates:
1. Advantages for each option
2. Disadvantages for each option
3. Decision matrix (Efficacy, Safety, Cost, Accessibility, Patient Pref)
4. Weights (which factors matter most?)
5. Special populations (pregnancy, pediatrics, elderly)
6. Contraindications

Replaces manual comparison task that takes doctors 10+ minutes.
```

---

## Interview Talking Points

### If asked: "Why is this better than UpToDate?"
> "UpToDate is great but costs $$$$/year and requires subscription. More importantly, it doesn't show you *how* it scored evidence quality. jubilant is transparent: here's why this source is credible, here's the GRADE level, here's what's missing. For open science and clinician education, that's valuable."

### If asked: "What about accuracy?"
> "We explicitly limit to PubMed to ensure accuracy. The LLM only synthesizes provided evidence—it can't hallucinate facts outside the context. If PubMed doesn't have good evidence, we tell you so (gap detection). This is more honest than pretending confidence we don't have."

### If asked: "How would you scale this?"
> "The design is already stateless (no server-side state). We can:
> 1. Cache PubMed results (most questions are similar)
> 2. Use Redis for API rate limiting
> 3. Scale horizontally (multiple Node instances)
> 4. CDN for frontend assets
> 5. Add async job queue if response time becomes issue"

### If asked: "What's missing?"
> "Potential future features:
> 1. EHR integration (get patient context automatically)
> 2. Real-time PubMed alerts (new studies relevant to patients)
> 3. Differential diagnosis helper
> 4. Drug interaction checker
> 5. Multi-language support
> But we nailed the core: fast, trustworthy, decision-supporting answers."

---

## Technical Strengths to Highlight

✅ **Full-stack**: Built both backend (Node/Express) and frontend (React/Vite)
✅ **API Design**: Clean separation of concerns, extensible service architecture
✅ **Medical Domain**: Understands GRADE scoring, clinical decision-making, evidence hierarchies
✅ **Cost-Conscious**: Gemini instead of GPT-4, no unnecessary databases
✅ **Production-Ready**: Error handling, graceful degradation, response time optimization
✅ **Modern Stack**: Vite, Gemini 2.0, async/await, proper env configuration

---

## Response Time Optimization
(If they ask how you achieved <6s)

1. **Parallel API calls**: PubMed, Clinical Trials, FDA called simultaneously (not sequentially)
2. **Timeout enforcement**: PubMed times out after 2s, continues with partial results
3. **LLM timeout**: If LLM takes >3s, return heuristic answer instead of blocking
4. **Smart caching**: Results cached in memory for 5 minutes (same question asked twice = instant second time)
5. **Lean JSON responses**: Only essential fields returned

---

## The Narrative for Tomorrow

**Opening**: 
> "I built a clinical decision-support system that helps doctors get trustworthy answers in under 6 seconds. The key insight: doctors don't want generic search results—they want evidence-graded answers with decision frameworks they can act on."

**Middle**:
> "Three standout features: (1) GRADE evidence scoring shows confidence level, (2) credibility analysis rates each source, (3) comparative framework auto-generates decision matrices for treatment comparisons."

**Close**:
> "It's designed for the real constraint doctors face: time. No subscriptions, no ads, just evidence + clinical decision support. Open source, scalable, and focused on the core problem: trustworthy fast answers."

---

Good luck! 🎯
