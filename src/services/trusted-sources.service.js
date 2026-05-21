const axios = require("axios");

const { tokenize } = require("../utils/text.util");

const REQUEST_TIMEOUT = 15000;

function keywordOverlapCount(text, keywords) {
  const textTokens = new Set(tokenize(text));
  let count = 0;
  for (const keyword of keywords) {
    if (textTokens.has(keyword)) count += 1;
  }
  return count;
}

function filterByQuestionRelevance(records, question) {
  const keywords = tokenize(question).slice(0, 6);
  if (!keywords.length) return records;

  return records.filter((record) => {
    const title = record.title || "";
    const abstract = record.abstract || "";
    const conditions = Array.isArray(record.conditions) ? record.conditions.join(" ") : "";

    // Clinical trial summaries can mention unrelated diseases incidentally,
    // so prefer title/condition matching for trial registry records.
    if (record.sourceType === "trial-registry") {
      const trialSignal = `${title} ${conditions}`;
      return keywordOverlapCount(trialSignal, keywords) > 0;
    }

    const haystack = `${title} ${abstract} ${conditions}`;
    return keywordOverlapCount(haystack, keywords) > 0;
  });
}

function yearFromDate(value) {
  const text = String(value || "");
  const match = text.match(/(19|20)\d{2}/);
  return match ? match[0] : "Unknown";
}

async function fetchClinicalTrialsEvidence(question, maxItems = 3) {
  const pageSize = Math.min(Math.max(maxItems, 1), 5);
  const tokenized = tokenize(question).slice(0, 6);
  const trialQueries = [
    question,
    tokenized.slice(0, 6).join(" "),
    tokenized.filter((token) => /(diabetes|cancer|heart|stroke|kidney|infection|asthma|covid|obesity|hypertension|semaglutide)/.test(token)).join(" "),
  ].filter(Boolean);

  let studies = [];
  for (const query of trialQueries) {
    const response = await axios.get("https://clinicaltrials.gov/api/v2/studies", {
      params: {
        "query.term": query,
        pageSize,
        format: "json",
      },
      timeout: REQUEST_TIMEOUT,
    });

    studies = response.data?.studies || [];
    if (studies.length) break;
  }

  return studies
    .map((study) => {
      const protocol = study?.protocolSection || {};
      const identification = protocol?.identificationModule || {};
      const description = protocol?.descriptionModule || {};
      const status = protocol?.statusModule || {};
      const conditionsModule = protocol?.conditionsModule || {};

      const nctId = identification?.nctId;
      const title = identification?.officialTitle || identification?.briefTitle;
      if (!nctId || !title) return null;

      const briefSummary = description?.briefSummary || "";
      const conditions = conditionsModule?.conditions || [];

      return {
        id: `NCT:${nctId}`,
        source: "ClinicalTrials.gov",
        sourceType: "trial-registry",
        title,
        journal: "ClinicalTrials.gov",
        year: yearFromDate(status?.studyFirstSubmitDate || status?.statusVerifiedDate),
        abstract: briefSummary,
        conditions,
        url: `https://clinicaltrials.gov/study/${nctId}`,
      };
    })
    .filter(Boolean);
}

async function fetchOpenFdaEvidence(question, maxItems = 2) {
  const tokens = tokenize(question).slice(0, 6);
  if (!tokens.length) return [];

  const limit = Math.min(Math.max(maxItems, 1), 3);
  const preferred = tokens.filter((token) => /(semaglutide|insulin|metformin|warfarin|aspirin|atorvastatin|lisinopril)/.test(token));
  const openFdaQueries = [
    preferred.length ? `openfda.generic_name:${preferred[0]}` : "",
    `indications_and_usage:${tokens[0]}`,
    `indications_and_usage:${tokens.slice(0, 2).join("+AND+indications_and_usage:")}`,
  ].filter(Boolean);

  let labels = [];
  for (const search of openFdaQueries) {
    try {
      const response = await axios.get("https://api.fda.gov/drug/label.json", {
        params: {
          search,
          limit,
        },
        timeout: REQUEST_TIMEOUT,
      });
      labels = response.data?.results || [];
      if (labels.length) break;
    } catch (error) {
      labels = [];
    }
  }

  return labels
    .map((label) => {
      const openFda = label?.openfda || {};
      const generic = openFda?.generic_name?.[0] || openFda?.brand_name?.[0];
      const setId = label?.set_id || openFda?.spl_set_id?.[0];
      if (!generic || !setId) return null;

      return {
        id: `FDA:${setId}`,
        source: "openFDA Drug Label",
        sourceType: "regulatory",
        title: `${generic} prescribing information`,
        journal: "U.S. FDA",
        year: yearFromDate(label?.effective_time),
        abstract: (label?.indications_and_usage?.[0] || label?.warnings?.[0] || "").slice(0, 900),
        url: `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setId}`,
      };
    })
    .filter(Boolean);
}

async function fetchTrustedSources(question, options = {}) {
  const jobs = [];

  if (options.includeClinicalTrials !== false) {
    jobs.push(fetchClinicalTrialsEvidence(question));
  }
  if (options.includeOpenFda !== false) {
    jobs.push(fetchOpenFdaEvidence(question));
  }

  if (!jobs.length) return [];

  const settled = await Promise.allSettled(jobs);

  const merged = [];
  for (const result of settled) {
    if (result.status === "fulfilled") {
      merged.push(...result.value);
    }
  }

  return filterByQuestionRelevance(merged, question);
}

module.exports = {
  fetchTrustedSources,
};
