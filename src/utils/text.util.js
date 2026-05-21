const STOPWORDS = new Set([
  "a", "an", "and", "the", "to", "for", "in", "on", "of", "with",
  "is", "are", "do", "does", "can", "should", "what", "which", "how",
  "when", "at", "from", "by", "or", "be", "as", "treat", "treatment",
  "therapy", "management", "study", "trial", "patients", "patient",
  "adults", "adult", "children", "child",
]);

/**
 * Tokenizes text, removes punctuation, lowercases, and removes stopwords.
 */
function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * Splits a large block of text into distinct sentences.
 * Filters out sentences that are too short or too long.
 */
function sentenceSplit(text) {
  return String(text || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 280);
}

module.exports = {
  tokenize,
  sentenceSplit,
};
