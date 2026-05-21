const { pipeline, cos_sim } = require("@xenova/transformers");

let extractorCache = null;

/**
 * Initializes and caches the Hugging Face transformer pipeline for dense embeddings.
 */
async function getExtractor() {
  if (!extractorCache) {
    extractorCache = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      quantized: true, // Use lighter quantized version for faster inference
    });
  }
  return extractorCache;
}

/**
 * Generates a dense vector embedding for a given text string.
 */
async function getDenseEmbedding(text, extractor) {
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

/**
 * Calculates the cosine similarity between two dense vectors.
 */
function calculateCosineSimilarity(vecA, vecB) {
  return cos_sim(vecA, vecB);
}

module.exports = {
  getExtractor,
  getDenseEmbedding,
  calculateCosineSimilarity,
};
