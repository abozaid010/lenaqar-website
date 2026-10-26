/**
 * Arabic display names for developers, projects, and places.
 *
 * The public units feed often sends English `developer` / `project` and leaves
 * `developer_ar` / `project_ar` empty. Callers pass lookup maps built from the
 * public developer and project catalogs. This module does not fetch anything.
 */

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** Fold a name into a lookup key. Punctuation and extra spaces do not matter. */
export function normalizeNameKey(value) {
  return clean(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Keys to try for one catalog or unit name.
 * Splits "Talaat Moustafa | TMG" and "LMD (Landmark Sabbour)" before
 * normalizing, and drops a leading el/al/the/il so "el patio vida" matches
 * the catalog's "patio vida".
 */
export function nameKeys(value) {
  const raw = clean(value);
  if (!raw) return [];

  const pieces = [];
  for (const part of raw.split("|")) {
    const piece = part.trim();
    if (!piece) continue;
    const paren = piece.match(/^(.*)\(([^)]+)\)(.*)$/);
    if (paren) {
      const outside = `${paren[1]} ${paren[3]}`.replace(/\s+/g, " ").trim();
      if (outside) pieces.push(outside);
      const inside = paren[2].trim();
      if (inside) pieces.push(inside);
    } else {
      pieces.push(piece);
    }
  }

  const keys = new Set();
  for (const piece of pieces) {
    const key = normalizeNameKey(piece);
    if (key.length >= 2) keys.add(key);
    const stripped = key.replace(/^(el|al|the|il)\s+/, "");
    if (stripped.length >= 2) keys.add(stripped);
  }
  return [...keys];
}

/**
 * @param {{ en?: string | string[], ar?: string }[]} pairs
 * @returns {Map<string, string>}
 */
export function indexArabicNames(pairs) {
  const map = new Map();
  for (const pair of pairs || []) {
    const ar = clean(pair?.ar);
    if (!ar || !/[\u0600-\u06ff]/.test(ar)) continue;
    const ens = Array.isArray(pair.en) ? pair.en : [pair.en];
    for (const en of ens) {
      for (const key of nameKeys(en)) {
        if (!map.has(key)) map.set(key, ar);
      }
    }
  }
  return map;
}

export function lookupArabicName(map, value) {
  if (!map || typeof map.get !== "function") return "";
  for (const key of nameKeys(value)) {
    const hit = map.get(key);
    if (hit) return hit;
  }
  return "";
}

/** "madinaty b14" → "مدينتي ب 14". Other phase codes are left alone. */
export function madinatyPhaseAr(project) {
  const match = normalizeNameKey(project).match(/^madinaty b(\d+)$/);
  if (!match) return "";
  return `مدينتي ب ${match[1]}`;
}

function arabicOnly(value) {
  const text = clean(value);
  if (!text || !/[\u0600-\u06ff]/.test(text) || /[A-Za-z]/.test(text)) return "";
  return text;
}

/**
 * Fill missing Arabic labels. Existing `*Ar` values from the unit win.
 * `placeAr` must return "" when the token is unknown — never the raw English.
 *
 * @param {object} unit
 * @param {{ developers?: Map<string, string>, projects?: Map<string, string>, placeAr?: (value: unknown) => string }} maps
 */
export function applyArabicLabels(unit, maps = {}) {
  if (!unit || typeof unit !== "object") return unit;

  const place = typeof maps.placeAr === "function" ? maps.placeAr : () => "";
  const developerAr =
    clean(unit.developerAr) ||
    lookupArabicName(maps.developers, unit.developer) ||
    lookupArabicName(maps.projects, unit.developer) ||
    madinatyPhaseAr(unit.developer) ||
    arabicOnly(unit.developer);
  const projectAr =
    clean(unit.projectAr) ||
    lookupArabicName(maps.projects, unit.project) ||
    madinatyPhaseAr(unit.project) ||
    place(unit.project) ||
    arabicOnly(unit.project);

  return {
    ...unit,
    developerAr,
    projectAr,
    cityAr: clean(unit.cityAr) || place(unit.city),
    districtAr: clean(unit.districtAr) || place(unit.district),
    subDistrictAr: clean(unit.subDistrictAr) || place(unit.subDistrict),
  };
}
