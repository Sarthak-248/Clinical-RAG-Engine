const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const env = require("../config/env");

const EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const REQUEST_TIMEOUT = 15000;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
});

function decodeEntities(input) {
  return String(input || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function extractText(node) {
  if (node === null || node === undefined) return "";
  if (typeof node === "string" || typeof node === "number") {
    return decodeEntities(String(node).trim());
  }
  if (Array.isArray(node)) {
    return decodeEntities(node.map(extractText).filter(Boolean).join(" ").trim());
  }

  if (typeof node === "object") {
    if (node["#text"]) return decodeEntities(String(node["#text"]).trim());
    if (node.text) return decodeEntities(String(node.text).trim());

    const values = Object.values(node).map(extractText).filter(Boolean);
    return decodeEntities(values.join(" ").trim());
  }

  return "";
}

function getPublicationYear(articleNode) {
  const pubDate =
    articleNode?.MedlineCitation?.Article?.Journal?.JournalIssue?.PubDate ||
    articleNode?.MedlineCitation?.DateCompleted ||
    articleNode?.MedlineCitation?.DateRevised;

  const year = extractText(pubDate?.Year);
  if (year) return year;

  const medlineDate = extractText(pubDate?.MedlineDate);
  const yearMatch = medlineDate.match(/(19|20)\d{2}/);
  return yearMatch ? yearMatch[0] : "Unknown";
}

async function searchPubMedIds(question, maxArticles = 8) {
  const params = {
    db: "pubmed",
    retmode: "json",
    sort: "relevance",
    retmax: Math.min(Math.max(maxArticles, 3), 12),
    term: `${question} AND hasabstract[text]`,
    tool: env.pubMedTool,
  };

  if (env.pubMedEmail) params.email = env.pubMedEmail;

  try {
    console.log("[pubmed] Searching for:", params.term);
    const response = await axios.get(`${EUTILS_BASE}/esearch.fcgi`, {
      params,
      timeout: REQUEST_TIMEOUT,
    });

    const pmids = response.data?.esearchresult?.idlist || [];
    console.log(`[pubmed] Found ${pmids.length} articles`);
    return pmids;
  } catch (error) {
    console.error("[pubmed] Search failed:", error.message);
    return [];
  }
}

async function fetchPubMedArticles(pmids) {
  if (!pmids.length) {
    console.warn("[pubmed] No PMIDs to fetch");
    return [];
  }

  const params = {
    db: "pubmed",
    id: pmids.join(","),
    rettype: "abstract",
    retmode: "xml",
    tool: env.pubMedTool,
  };

  if (env.pubMedEmail) params.email = env.pubMedEmail;

  try {
    const response = await axios.get(`${EUTILS_BASE}/efetch.fcgi`, {
      params,
      timeout: REQUEST_TIMEOUT,
    });

    const parsed = xmlParser.parse(response.data);
    const articles = asArray(parsed?.PubmedArticleSet?.PubmedArticle);

    return articles
      .map((articleNode) => {
        const medline = articleNode?.MedlineCitation;
        const article = medline?.Article;
        const pmid = extractText(medline?.PMID);
        const title = extractText(article?.ArticleTitle);
        const journal = extractText(article?.Journal?.Title);
        const year = getPublicationYear(articleNode);

        const abstractSegments = asArray(article?.Abstract?.AbstractText)
          .map(extractText)
          .filter(Boolean);

        const abstract = abstractSegments.join(" ").replace(/\s+/g, " ").trim();

        return {
          pmid,
          title,
          journal,
          year,
          abstract,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        };
      })
      .filter((item) => item.pmid && item.title);
  } catch (error) {
    return [];
  }
}

module.exports = {
  searchPubMedIds,
  fetchPubMedArticles,
};
