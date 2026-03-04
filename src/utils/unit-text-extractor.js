/**
 * UnitTextExtractor
 *
 * Client-side extraction of real-estate unit details from plain text.
 * Pipeline per field: exact match → regex match → fuzzy/semantic match.
 * Returns canonical enum values from constants.js for every enum field,
 * plus numeric values for area, price, rooms, bathrooms, floor, etc.
 *
 * Design: All extraction is driven by declarative keyword/synonym tables.
 * No field has its own hardcoded function — a generic engine resolves everything.
 */

import {
  BUILDING_TYPE_VALUES,
  VIEW_TYPE_VALUES,
  FINISHING_TYPE_VALUES,
  FURNISHING_TYPE_VALUES,
  PROPERTY_STATUS_VALUES,
  PROPERTY_USAGE_VALUES,
  PROPERTY_PURPOSE_VALUES,
  PROPERTY_INTENT_VALUES,
} from "@/data/constants";

// ─── Synonyms ────────────────────────────────────────────────────────────────
// Maps common alternative spellings / abbreviations to canonical enum values.

const BUILDING_TYPE_SYNONYMS = {
  apt: "apartment",
  flat: "apartment",
  "s villa": "svilla",
  "s-villa": "svilla",
  "semi villa": "svilla",
  "twin house": "twinhouse",
  "twin villa": "twinhouse",
  "town house": "townhouse",
  "sky villa": "sky loft",
  "ground duplex": "duplex ground",
  "roof duplex": "duplex roof",
  "serviced apt": "serviced apartment",
  "f&b": "food and beverage",
  fnb: "food and beverage",
  "office space": "office",
  "beauty center": "beauty salon",
  salon: "beauty salon",
  "co working": "workspace",
  coworking: "workspace",
  store: "storage",
  "store room": "storage",
};

const VIEW_TYPE_SYNONYMS = {
  "garden view": "garden",
  "sea view": "sea",
  "pool view": "pool",
  "swimming pool": "pool",
  "street view": "street",
  "city view": "city",
  "park view": "park",
  "mountain view": "mountain",
  "river view": "river",
  "lagoon view": "lagoon",
  "golf view": "golf",
  "open area view": "open area",
  "open view": "open area",
  landscape: "garden",
  nile: "river",
  "nile view": "river",
  oceanfront: "sea",
  beachfront: "sea",
  lakefront: "lagoon",
  lake: "lagoon",
  "lake view": "lagoon",
};

const FINISHING_TYPE_SYNONYMS = {
  finished: "fully finished",
  "full finishing": "fully finished",
  "fully finishe": "fully finished",
  ff: "fully finished",
  "semi finish": "semi finished",
  sf: "semi finished",
  "half finished": "semi finished",
  shell: "core & shell",
  "core and shell": "core & shell",
  "core shell": "core & shell",
  cs: "core & shell",
  "white shell": "white box",
  flexy: "flixy",
  flexi: "flixy",
  "turn key": "turnkey",
  "move in ready": "turnkey",
};

const FURNISHING_TYPE_SYNONYMS = {
  "fully furnished": "furnished",
  "full furniture": "furnished",
  "with furniture": "furnished",
  "not furnished": "unfurnished",
  "no furniture": "unfurnished",
  "without furniture": "unfurnished",
  empty: "unfurnished",
  "hotel furnished": "hotel_furnished",
  "hotel furnishing": "hotel_furnished",
  "hotel style": "hotel_furnished",
  "half furnished": "partially furnished",
  "semi furnished": "partially furnished",
  "partial furniture": "partially furnished",
  flexy: "flixy",
  flexi: "flixy",
  "turn key": "turnkey",
};

const PROPERTY_STATUS_SYNONYMS = {
  "move in": "ready to move",
  "ready to move in": "ready to move",
  "already delivered": "ready to move",
  "under construction": "off-plan",
  offplan: "off-plan",
  "off plan": "off-plan",
  "not delivered": "off-plan",
};

const PROPERTY_USAGE_SYNONYMS = {
  residential: "residential",
  home: "residential",
  living: "residential",
  commercial: "commercial",
  business: "commercial",
  office: "commercial",
  "mixed use": "mixed-use",
};

const PROPERTY_PURPOSE_SYNONYMS = {
  invest: "investment",
  investing: "investment",
  "for investment": "investment",
  "for living": "housing",
  "for housing": "housing",
  live: "housing",
  "self use": "housing",
};

const PROPERTY_INTENT_SYNONYMS = {
  buying: "buy",
  purchase: "buy",
  "for sale": "sell",
  selling: "sell",
  renting: "rent",
  "for rent": "rent",
  leasing: "lease",
  "for lease": "lease",
};

// ─── Text Normalizer ─────────────────────────────────────────────────────────

function normalize(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u2000-\u206F\u2E00-\u2E7F•·●▪►‣⁃‐‑‒–—―…\u200B-\u200F\uFEFF]/g, " ")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Levenshtein Distance ────────────────────────────────────────────────────

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

// ─── Regex Builder ───────────────────────────────────────────────────────────

function buildRegex(value) {
  const words = value.split(/\s+/);
  const escaped = words.map((w) => {
    if (w === "&") return "(?:[&]|and)";
    return w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  });
  return new RegExp(`\\b${escaped.join("\\s+")}\\b`, "i");
}

// ─── Core Enum Extraction Pipeline ───────────────────────────────────────────

/**
 * @param {string} text       — raw input text
 * @param {string[]} list     — canonical enum values
 * @param {Object} [synonyms] — extra synonym → canonical map
 * @returns {{ exact_match, regex_match, semantic_match, final }}
 */
function extractEnum(text, list, synonyms = {}) {
  const normalized = normalize(text);

  let exactMatch = null;
  let regexMatch = null;
  let semanticMatch = null;

  // Merge enums + synonyms into one candidate list, sorted longest-first.
  // Synonyms are more specific (e.g. "sea view" vs "sea"), so they naturally
  // win when sorted by length. This prevents short generic enums from matching
  // before a more contextual synonym.
  const allExactCandidates = [
    ...list.map((v) => ({ text: v, canonical: v })),
    ...Object.entries(synonyms).map(([syn, canonical]) => ({ text: syn, canonical })),
  ].sort((a, b) => b.text.length - a.text.length);

  // 1. Exact + contains match (longest wins across enums AND synonyms)
  for (const { text: candidate, canonical } of allExactCandidates) {
    const normCandidate = normalize(candidate);
    if (normalized === normCandidate) { exactMatch = canonical; break; }
    if (normalized.includes(normCandidate) && !exactMatch) {
      exactMatch = canonical;
    }
  }

  // 2. Regex match (longest first, enums + synonyms merged)
  const sortedList = [...list].sort((a, b) => b.length - a.length);
  const allRegexCandidates = [
    ...list.map((v) => ({ text: v, canonical: v })),
    ...Object.entries(synonyms).map(([syn, canonical]) => ({ text: syn, canonical })),
  ].sort((a, b) => b.text.length - a.text.length);

  for (const { text: candidate, canonical } of allRegexCandidates) {
    if (buildRegex(candidate).test(text)) { regexMatch = canonical; break; }
  }

  // 3. Fuzzy / semantic match (Levenshtein on sliding windows)
  let bestScore = Infinity;
  const allCandidates = [...list, ...Object.keys(synonyms)];
  const words = normalized.split(" ");
  for (const candidate of allCandidates) {
    const normCandidate = normalize(candidate);
    const candidateWordCount = normCandidate.split(" ").length;
    // Slide windows of matching word count ± 1
    for (let len = Math.max(1, candidateWordCount - 1); len <= Math.min(words.length, candidateWordCount + 1); len++) {
      for (let start = 0; start <= words.length - len; start++) {
        const window = words.slice(start, start + len).join(" ");
        const distance = levenshtein(window, normCandidate);
        const maxLen = Math.max(normCandidate.length, window.length, 1);
        const score = distance / maxLen;
        if (score < 0.35 && score < bestScore) {
          bestScore = score;
          semanticMatch = list.includes(candidate)
            ? candidate
            : synonyms[candidate] || candidate;
        }
      }
    }
  }

  const finalMatch = exactMatch || regexMatch || semanticMatch || null;
  return {
    exact_match: exactMatch,
    regex_match: regexMatch,
    semantic_match: semanticMatch,
    final: finalMatch,
  };
}

// ─── Generic Numeric Extraction Engine ───────────────────────────────────────
//
// Instead of one function per numeric field, we use a declarative config.
// Each field has: keywords (before/after), units, and value constraints.
// The engine builds regex dynamically from these and runs them on the text.
//
// IMPORTANT: keywords are PLAIN TEXT — automatically escaped for regex.
//            unitPatterns are RAW REGEX strings — used as-is in alternation.

const ORDINAL_WORDS = {
  ground: 0, basement: -1,
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15,
};

const NUM_RE = String.raw`(\d[\d,]*(?:\.\d+)?)`;
const SEP = String.raw`\s*[:\-–=]?\s*`;
const CURRENCY_RE = String.raw`(?:egp|le|e\.?g\.?p\.?)`;

/**
 * Escape a plain-text keyword for use inside a regex.
 * Multi-word keywords get \s+ between words so "built up" matches "built  up".
 */
function escapeKeyword(kw) {
  return kw
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
}

/**
 * Declarative numeric field definitions.
 * - keywords:     plain-text strings (auto-escaped, spaces become \s+)
 * - unitPatterns: raw regex fragments for unit matching (NOT escaped)
 * - min:          minimum valid value (inclusive, default 0)
 * - ordinals:     if true, match ordinal words ("ground", "first", etc.)
 * - currencyAware: if true, match currency prefixes/suffixes
 */
const NUMERIC_FIELDS = {
  landArea: {
    keywords: ["area", "space", "size", "built up", "bua", "built area"],
    unitPatterns: ["sqm", "sq\\.?\\s*m", "m[²2]", "square\\s*met(?:er|re)s?", "met(?:er|re)s?"],
    min: 1,
    standaloneUnits: true,
  },
  totalPrice: {
    keywords: ["price", "total", "total price", "cost"],
    unitPatterns: [],
    min: 1,
    currencyAware: true,
    primaryCurrency: true,
  },
  downPayment: {
    keywords: ["down payment", "downpayment", "required now"],
    unitPatterns: [],
    min: 1,
    currencyAware: true,
  },
  remaining_amount: {
    keywords: ["remaining", "remaining amount", "balance", "outstanding", "rest"],
    unitPatterns: [],
    min: 1,
    currencyAware: true,
  },
  roomsCount: {
    keywords: ["bedroom", "bedrooms", "bed", "beds", "br", "bdr", "bdrm", "room", "rooms"],
    unitPatterns: [],
    min: 1,
  },
  bathroomCount: {
    keywords: ["bathroom", "bathrooms", "bath", "baths", "ba", "bth", "wc", "toilet", "toilets", "lavatory", "lavatories"],
    unitPatterns: [],
    min: 1,
  },
  floor: {
    keywords: ["floor", "level", "storey", "story"],
    unitPatterns: [],
    min: 0,
    ordinals: true,
  },
  gardenSize: {
    keywords: ["garden", "private garden", "yard", "backyard"],
    unitPatterns: ["sqm", "sq\\.?\\s*m", "m[²2]"],
    min: 1,
  },
  garageArea: {
    keywords: ["garage area", "garage size", "garage space", "parking area", "parking size", "parking space"],
    unitPatterns: ["sqm", "sq\\.?\\s*m", "m[²2]"],
    min: 1,
  },
  installment_years: {
    keywords: ["installment", "installments", "payment plan"],
    unitPatterns: ["years?", "yrs?"],
    min: 1,
  },
  over_price: {
    keywords: ["over price", "overprice", "offer price"],
    unitPatterns: [],
    min: 1,
    currencyAware: true,
  },
};

/**
 * Dynamically builds and runs regex patterns from a field config.
 * Tries: keyword SEP number, number keyword, number unit, currency number, etc.
 */
function extractNumericField(text, config) {
  const {
    keywords, unitPatterns = [], min = 0,
    ordinals = false, currencyAware = false,
    primaryCurrency = false, standaloneUnits = false,
  } = config;

  const kwAlt = keywords.map(escapeKeyword).join("|");
  const unitAlt = unitPatterns.length > 0 ? unitPatterns.join("|") : null;

  const patterns = [];

  // Currency-aware: keyword + optional currency + number
  if (currencyAware) {
    patterns.push(new RegExp(`(?:${kwAlt})${SEP}${CURRENCY_RE}?\\s*${NUM_RE}`, "i"));
    // Generic "currency + number" / "number + currency" only for the primary price field
    if (primaryCurrency) {
      patterns.push(new RegExp(`${CURRENCY_RE}\\s*${NUM_RE}`, "i"));
      patterns.push(new RegExp(`${NUM_RE}\\s*${CURRENCY_RE}`, "i"));
    }
  }
  // keyword SEP number
  patterns.push(new RegExp(`(?:${kwAlt})${SEP}${NUM_RE}`, "i"));
  // number + keyword
  patterns.push(new RegExp(`${NUM_RE}\\s+(?:${kwAlt})`, "i"));
  if (unitAlt) {
    // keyword + number + unit
    patterns.push(new RegExp(`(?:${kwAlt})${SEP}${NUM_RE}\\s*(?:${unitAlt})`, "i"));
    // Standalone: number + unit (only for fields like landArea where "102.5 sqm" alone is meaningful)
    if (standaloneUnits) {
      patterns.push(new RegExp(`${NUM_RE}\\s*(?:${unitAlt})`, "i"));
    }
  }
  // Ordinal-suffix number: "3rd floor", "1st level"
  patterns.push(new RegExp(`${NUM_RE}\\s*(?:st|nd|rd|th)\\s+(?:${kwAlt})`, "i"));

  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m) {
      const captured = m.slice(1).find((g) => g !== undefined);
      if (captured == null) continue;
      const num = parseFloat(captured.replace(/,/g, ""));
      if (!isNaN(num) && num >= min) return num;
    }
  }

  // Multiplier words ("3.5 million EGP")
  if (currencyAware) {
    const milPatterns = [
      new RegExp(`(?:${kwAlt})${SEP}${NUM_RE}\\s*(?:million|mil)`, "i"),
      new RegExp(`${NUM_RE}\\s*(?:million|mil)`, "i"),
    ];
    for (const p of milPatterns) {
      const m = text.match(p);
      if (m) {
        const captured = m.slice(1).find((g) => g !== undefined);
        if (captured) {
          const num = parseFloat(captured.replace(/,/g, "")) * 1_000_000;
          if (!isNaN(num) && num >= min) return num;
        }
      }
    }
  }

  // Ordinal word matching ("ground floor" → 0, "first floor" → 1, etc.)
  if (ordinals) {
    const ordAlt = Object.keys(ORDINAL_WORDS).join("|");
    const ordPatterns = [
      new RegExp(`\\b(${ordAlt})\\s+(?:${kwAlt})\\b`, "i"),
      new RegExp(`(?:${kwAlt})${SEP}(${ordAlt})\\b`, "i"),
    ];
    for (const p of ordPatterns) {
      const m = text.match(p);
      if (m) {
        const word = (m[1] || "").toLowerCase();
        if (word in ORDINAL_WORDS) return ORDINAL_WORDS[word];
      }
    }
  }

  return null;
}

// ─── Date Extraction ─────────────────────────────────────────────────────────

const DELIVERY_KEYWORDS = String.raw`deliver(?:y|ed)?|handover|completion|ready|receiving`;
const MONTH_NAMES = String.raw`Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?`;

const MONTH_TO_NUM = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

function parseMonthStr(str) {
  if (!str) return null;
  const key = str.toLowerCase().slice(0, 3);
  return MONTH_TO_NUM[key] || null;
}

function extractDeliveryDate(text) {
  const kw = `(?:${DELIVERY_KEYWORDS})`;
  const sep = String.raw`\s*(?:date|by|in|on)?\s*[:\-–]?\s*`;

  // Full date: delivery 2028-06-15 or 2028/6/1
  const fullDate = text.match(new RegExp(`${kw}${sep}(\\d{4})[\\-/](\\d{1,2})[\\-/](\\d{1,2})`, "i"));
  if (fullDate) {
    return `${fullDate[1]}-${fullDate[2].padStart(2, "0")}-${fullDate[3].padStart(2, "0")}`;
  }

  // Month + Year: "delivery June 2028", "delivered Jan 2027"
  const monthYear = text.match(new RegExp(`${kw}${sep}(${MONTH_NAMES})\\s*(\\d{4})`, "i"));
  if (monthYear) {
    const mo = parseMonthStr(monthYear[1]);
    if (mo) return `${monthYear[2]}-${mo}-01`;
  }

  // Quarter + Year: "delivery Q3 2025"
  const qYear = text.match(new RegExp(`${kw}${sep}Q([1-4])\\s*(\\d{4})`, "i"));
  if (qYear) {
    const qMonth = String((parseInt(qYear[1], 10) - 1) * 3 + 1).padStart(2, "0");
    return `${qYear[2]}-${qMonth}-01`;
  }

  // Year only: "Delivery 2028"
  const yearOnly = text.match(new RegExp(`${kw}${sep}(\\d{4})\\b`, "i"));
  if (yearOnly) {
    const yr = parseInt(yearOnly[1], 10);
    if (yr >= 1990 && yr <= 2050) return `${yr}-01-01`;
  }

  // Reverse: "2028 delivery", or "till 2034"
  const reverseYear = text.match(/\b(?:till|until|by)\s+(\d{4})\b/i)
    || text.match(/(\d{4})\s*(?:deliver(?:y|ed)?|handover|completion)/i);
  if (reverseYear) {
    const yr = parseInt(reverseYear[1], 10);
    if (yr >= 1990 && yr <= 2050) return `${yr}-01-01`;
  }

  return null;
}

// ─── String Field Extraction ─────────────────────────────────────────────────
//
// Generic labeled-string extractor: given a list of label keywords, finds
// the text value that follows.

function extractLabeledString(text, labelKeywords, opts = {}) {
  const { minLen = 2, maxLen = 60, validationRe = null } = opts;
  const labelAlt = labelKeywords
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const patterns = [
    // label: "Value" or label: Value (until comma/newline/pipe)
    new RegExp(`(?:${labelAlt})\\s*(?:name)?\\s*[:\\-–]\\s*["']?([^"'\\n|,]+?)["']?\\s*(?:[,|\\n]|$)`, "i"),
    // label Value (after known prepositions)
    new RegExp(`(?:${labelAlt})\\s*(?:name)?\\s+["']?([A-Za-z0-9][^"'\\n|,]{1,58})["']?\\s*(?:[,|\\n]|$)`, "i"),
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const val = m[1].trim();
      if (val.length >= minLen && val.length <= maxLen) {
        if (validationRe && !validationRe.test(val)) continue;
        return val;
      }
    }
  }
  return null;
}

function extractProject(text) {
  // Try labeled extraction first
  const labeled = extractLabeledString(text, [
    "project", "compound", "community", "development", "complex",
  ]);
  if (labeled) return labeled;

  // Try "in/at <ProperNoun>" heuristic
  const m = text.match(
    /(?:\bin\b|\bat\b|located\s+(?:in|at))\s+["']?([A-Z][A-Za-z0-9\s&'\-]{2,40})["']?\s*(?:[,.|–\-\n]|$)/,
  );
  if (m) {
    const val = m[1].trim();
    if (val.length >= 2 && val.length <= 60) return val;
  }
  return null;
}

function extractPhase(text) {
  return extractLabeledString(text, ["phase", "stage"], { maxLen: 20 });
}

function extractUnitCode(text) {
  return extractLabeledString(text, ["unit code", "unit no", "unit number", "unit #", "unit id"], {
    maxLen: 30,
    validationRe: /^[A-Za-z0-9\-]+$/,
  });
}

function extractModel(text) {
  return extractLabeledString(text, ["model", "type name", "unit type"], { maxLen: 40 });
}

function extractOwnerName(text) {
  return extractLabeledString(text, ["owner", "seller", "landlord", "contact"], { maxLen: 60 });
}

function extractOwnerMobile(text) {
  // Labeled phone
  const labeled = text.match(
    /(?:(?:owner|seller|contact|landlord)?\s*(?:mobile|phone|cell|tel|whatsapp|wa)\s*[:\-–]?\s*)((?:\+?\d[\d\s\-()]{7,17}))/i,
  );
  if (labeled) return labeled[1].replace(/[\s\-()]/g, "");

  // Any phone-like number (international or local patterns)
  const phonePatterns = [
    /(?:\+\d{1,3}\s*)?(?:\(?\d{2,4}\)?\s*)?\d{3,4}[\s\-]?\d{3,4}/,
  ];
  for (const p of phonePatterns) {
    const m = text.match(p);
    if (m) {
      const digits = m[0].replace(/[\s\-()]/g, "");
      if (digits.length >= 8 && digits.length <= 15) return digits;
    }
  }
  return null;
}

// ─── Main Extractor Class ────────────────────────────────────────────────────

export class UnitTextExtractor {
  /**
   * Extract all unit fields from plain text.
   * @param {string} text — raw text (WhatsApp, Facebook, plain description, etc.)
   * @returns {Object} — extracted unit with canonical enum values and numeric fields
   */
  static extract(text) {
    if (!text || typeof text !== "string") {
      return { _raw: text, _confidence: {} };
    }

    const confidence = {};

    // Enum fields
    const buildingType = extractEnum(text, BUILDING_TYPE_VALUES, BUILDING_TYPE_SYNONYMS);
    const viewType = extractEnum(text, VIEW_TYPE_VALUES, VIEW_TYPE_SYNONYMS);
    const finishing = extractEnum(text, FINISHING_TYPE_VALUES, FINISHING_TYPE_SYNONYMS);
    const furnishing = extractEnum(text, FURNISHING_TYPE_VALUES, FURNISHING_TYPE_SYNONYMS);
    const propertyStatus = extractEnum(text, PROPERTY_STATUS_VALUES, PROPERTY_STATUS_SYNONYMS);
    const propertyUsage = extractEnum(text, PROPERTY_USAGE_VALUES, PROPERTY_USAGE_SYNONYMS);
    const propertyPurpose = extractEnum(text, PROPERTY_PURPOSE_VALUES, PROPERTY_PURPOSE_SYNONYMS);
    const propertyIntent = extractEnum(text, PROPERTY_INTENT_VALUES, PROPERTY_INTENT_SYNONYMS);

    const setConfidence = (key, result) => {
      if (!result.final) return;
      if (result.exact_match) confidence[key] = "exact";
      else if (result.regex_match) confidence[key] = "regex";
      else if (result.semantic_match) confidence[key] = "semantic";
    };

    setConfidence("buildingType", buildingType);
    setConfidence("view", viewType);
    setConfidence("finishing", finishing);
    setConfidence("furnishing", furnishing);
    setConfidence("deliveryStatus", propertyStatus);
    setConfidence("propertyUsage", propertyUsage);
    setConfidence("propertyPurpose", propertyPurpose);
    setConfidence("purpose", propertyIntent);

    // ── Cross-field conflict resolution ──
    // When two related fields both resolve, but one is semantic-only while the
    // other has an exact/regex match, suppress the weaker one to avoid false
    // positives (e.g. "finished" fuzzy-matching "furnished").
    const conflictPairs = [
      ["finishing", "furnishing"],
    ];
    const resultMap = { finishing, furnishing };
    for (const [fieldA, fieldB] of conflictPairs) {
      const a = resultMap[fieldA];
      const b = resultMap[fieldB];
      if (!a.final || !b.final) continue;
      const aStrength = a.exact_match ? 3 : a.regex_match ? 2 : 1;
      const bStrength = b.exact_match ? 3 : b.regex_match ? 2 : 1;
      if (aStrength > bStrength && bStrength === 1) {
        b.final = null; b.semantic_match = null;
        confidence[fieldB] = undefined;
      } else if (bStrength > aStrength && aStrength === 1) {
        a.final = null; a.semantic_match = null;
        confidence[fieldA] = undefined;
      }
    }

    // Numeric fields (all driven by declarative config)
    const numericResults = {};
    for (const [field, config] of Object.entries(NUMERIC_FIELDS)) {
      numericResults[field] = extractNumericField(text, config);
    }

    // Date
    const deliveryDate = extractDeliveryDate(text);

    // String fields
    const project = extractProject(text);
    const phase = extractPhase(text);
    const code = extractUnitCode(text);
    const model = extractModel(text);
    const ownerName = extractOwnerName(text);
    const ownerMobile = extractOwnerMobile(text);

    // Derive purpose from intent (sell/buy → "sell", rent/lease → "rent")
    let purpose = null;
    if (propertyIntent.final) {
      const intent = propertyIntent.final;
      if (intent === "sell" || intent === "buy") purpose = "sell";
      else if (intent === "rent" || intent === "lease") purpose = "rent";
    }
    if (!purpose && numericResults.totalPrice) purpose = "sell";

    const unit = {};
    const set = (key, val) => {
      if (val != null) unit[key] = val;
    };

    set("buildingType", buildingType.final);
    set("view", viewType.final);
    set("finishing", finishing.final);
    set("furnishing", furnishing.final);
    set("deliveryStatus", propertyStatus.final);
    set("purpose", purpose);

    // Spread all numeric results
    for (const [field, val] of Object.entries(numericResults)) {
      set(field, val);
    }

    set("deliveryDate", deliveryDate);
    set("project", project);
    set("phase", phase);
    set("code", code);
    set("model", model);
    set("owner_name", ownerName);
    set("owner_mobile", ownerMobile);

    unit._confidence = confidence;
    unit._enumDetails = {
      buildingType,
      view: viewType,
      finishing,
      furnishing,
      deliveryStatus: propertyStatus,
      propertyUsage,
      propertyPurpose,
      purpose: propertyIntent,
    };

    return unit;
  }

  /**
   * Extract and return only the flat unit object (no debug metadata).
   * Ready to merge into formData.
   */
  static extractFlat(text) {
    const result = this.extract(text);
    const { _confidence, _enumDetails, ...flat } = result;
    return flat;
  }

  /**
   * Extract a single enum field.
   */
  static extractBuildingType(input) {
    return extractEnum(input, BUILDING_TYPE_VALUES, BUILDING_TYPE_SYNONYMS);
  }

  static extractViewType(input) {
    return extractEnum(input, VIEW_TYPE_VALUES, VIEW_TYPE_SYNONYMS);
  }

  static extractFinishingType(input) {
    return extractEnum(input, FINISHING_TYPE_VALUES, FINISHING_TYPE_SYNONYMS);
  }

  static extractFurnishingType(input) {
    return extractEnum(input, FURNISHING_TYPE_VALUES, FURNISHING_TYPE_SYNONYMS);
  }

  static extractPropertyStatus(input) {
    return extractEnum(input, PROPERTY_STATUS_VALUES, PROPERTY_STATUS_SYNONYMS);
  }

  static extractPropertyIntent(input) {
    return extractEnum(input, PROPERTY_INTENT_VALUES, PROPERTY_INTENT_SYNONYMS);
  }
}

export default UnitTextExtractor;
