
// Helper to render enrichment fields safely
function renderEnrichmentField(label, value) {
  if (!value) return null;
  // Special formatting for Recency Alert object
  if (label === "Recency Alert" && typeof value === "object" && value !== null) {
    return (
      <li>
        <strong>{label}:</strong> <span style={{ color: value.severity === "high" ? "#d9534f" : value.severity === "medium" ? "#f0ad4e" : "#5bc0de" }}>
          {value.severity ? `[${value.severity.toUpperCase()}] ` : null}{value.message || JSON.stringify(value)}
        </span>
      </li>
    );
  }
  // If value is an array, join or render as list
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return (
      <li><strong>{label}:</strong>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {value.map((v, i) => (
            <li key={i}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</li>
          ))}
        </ul>
      </li>
    );
  }
  // If value is an object, stringify it
  if (typeof value === "object") {
    return <li><strong>{label}:</strong> {JSON.stringify(value)}</li>;
  }
  // Otherwise, render as string
  return <li><strong>{label}:</strong> {String(value)}</li>;
}

import { useState } from "react";
import axios from "axios";

// Determine API URL based on where the browser is running
const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5000" 
  : "";

function formatLatency(ms) {
  if (!ms && ms !== 0) return "-";
  return `${(ms / 1000).toFixed(2)}s`;
}

function App() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (question.trim().length < 10) {
      setError("Please enter at least a 10-character medical question.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/medical/ask`, {
        question,
        maxArticles: 8,
      });
      setResult(response.data);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to retrieve evidence right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="hero medi-hero" style={{ padding: "2.5rem 3rem", textAlign: "center", marginBottom: "2rem" }}><h1 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>Jubilant Clinical-QA Engine</h1><p style={{ color: "#e0f2fe", fontSize: "1rem", margin: 0, opacity: 0.9 }}>Evidence-based medical intelligence</p></header>

      <main className="layout">
        <section className="card query-card">
          <form onSubmit={handleSubmit} className="medi-form">
            <label htmlFor="question" className="label" style={{ display: "none" }}>Enter Clinical Question</label>
            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Type your clinical question here..."
              rows={6}
              className="medi-textarea"
            />
            <button type="submit" className="medi-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="loader-spinner"></span> Reviewing Evidence...
                </>
              ) : "Get Evidence Summary"}
            </button>
          </form>
          {error ? <p className="error">{error}</p> : null}
        </section>

        <section className="card output-card">
          <div className="output-header medi-output-header">
            <h2 className="medi-section-title">Concise Clinical Answer</h2>
            <span className="latency">{formatLatency(result?.meta?.latencyMs)}</span>
          </div>

          {!result ? (
            <p className="placeholder">
              Your answer will appear here with trusted-source identifiers and direct citation links.
            </p>
          ) : (
            <>
              <p className="answer medi-answer">{result.answer}</p>

              {/* Display Key Points, Recommendations, and Red Flags directly below the main answer */}
              {result.structuredAnswer?.keyPoints?.length > 0 && (
                <div className="medi-structured-list">
                  <strong>Key Points:</strong>
                  <ul>
                    {result.structuredAnswer.keyPoints.map((kp, i) => <li key={i}>{kp}</li>)}
                  </ul>
                </div>
              )}

              {result.structuredAnswer?.redFlags?.length > 0 && (
                <div className="medi-structured-list red-flags-box">
                  <strong>Clinical Red Flags:</strong>
                  <ul>
                    {result.structuredAnswer.redFlags.map((rf, i) => <li key={i}>{rf}</li>)}
                  </ul>
                </div>
              )}

              {result.structuredAnswer?.recommendations?.length > 0 && (
                <div className="medi-structured-list recommendations-box">
                  <strong>Recommendations:</strong>
                  <ul>
                    {result.structuredAnswer.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                  </ul>
                </div>
              )}

              {/* Advanced Enrichment Fields */}
              {result.structuredAnswer && (
                <div className="enrichment-fields medi-enrichment">
                  <h3 className="medi-enrichment-title">Clinical Evidence Enrichment</h3>
                  <ul className="medi-enrichment-list">
                    {renderEnrichmentField("Confidence", result.structuredAnswer.confidence)}
                    {renderEnrichmentField("Evidence Strength", result.structuredAnswer.evidenceStrength)}
                    {renderEnrichmentField("Recency Alert", result.structuredAnswer.recencyAlert)}
                    {renderEnrichmentField("Risk-Benefit", result.structuredAnswer.riskBenefit)}
                    {renderEnrichmentField("Comparative Analysis", result.structuredAnswer.comparativeAnalysis)}
                    {renderEnrichmentField("Disclaimer", result.structuredAnswer.disclaimer)}
                  </ul>
                </div>
              )}

              {/* Comparative analysis from clinicalDecisionSupport if present */}
              {result.clinicalDecisionSupport?.comparisonReport && (
                <div className="enrichment-fields medi-enrichment">
                  <h3 className="medi-enrichment-title">Comparative Analysis</h3>
                  <pre className="medi-comparative-report">{result.clinicalDecisionSupport.comparisonReport}</pre>
                </div>
              )}

              <h3 className="medi-section-title">Key Evidence</h3>
              <ul className="evidence-list medi-evidence-list">
                {(result.evidence || []).map((item, index) => (
                  <li key={`${item.statement}-${index}`}>
                    <p>{item.statement}</p>
                    <p className="pmids">
                      Source: {item.source || "Unknown"} | Ref: {(item.citationIds || item.citationPmids || []).join(", ") || "N/A"}
                    </p>
                  </li>
                ))}
              </ul>

              <h3 className="medi-section-title">Sources</h3>
              <ul className="citation-list medi-citation-list">
                {(result.citations || []).map((citation) => (
                  <li key={citation.id || citation.pmid}>
                    <a href={citation.url} target="_blank" rel="noreferrer">
                      {citation.title}
                    </a>
                    <p>
                      {citation.journal} ({citation.year}) | {citation.source || "PubMed"} | {citation.id || citation.pmid}
                    </p>
                  </li>
                ))}
              </ul>

              <p className="source-note medi-source-note">Source set: {result.meta?.source || "PubMed"}</p>
            </>
          )}
        </section>
      </main>

      <footer className="footer medi-footer">
        <p className="medi-footer-text">
          <span className="medi-logo">✚</span> Medi+ — Professional Clinical Q&A. Always verify recommendations against full-text guidelines and patient context.
        </p>
      </footer>
    </div>
  );
}

export default App;

