import { createHash } from "crypto";

const ALLOWED_INTENTS = new Set(["buy"]);
const BLOCKED_INTENTS = new Set(["rent", "lease", "sell"]);

function pickString(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickNumber(...vals) {
  for (const v of vals) {
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickPositiveInt(...vals) {
  const n = pickNumber(...vals);
  if (n == null) return null;
  const i = Math.trunc(n);
  return i > 0 ? i : null;
}

/**
 * Stable anonymous public id — never the CRM user_id / requirement UUID.
 * @param {string} seed
 */
export function publicRequirementId(seed) {
  const raw = String(seed || "").trim();
  if (!raw) return "";
  return createHash("sha256").update(`lenaqar-req:${raw}`).digest("hex").slice(0, 12);
}

/**
 * @param {unknown} raw
 * @returns {"buy" | null} null = exclude (rent / sell / blocked)
 */
export function resolvePublicIntent(raw) {
  if (!raw || typeof raw !== "object") return null;
  const row = /** @type {Record<string, unknown>} */ (raw);
  const intent = pickString(
    row.purpose,
    row.propertyPurpose,
    row.propertyIntent,
  ).toLowerCase();

  if (BLOCKED_INTENTS.has(intent)) return null;
  if (ALLOWED_INTENTS.has(intent)) return "buy";
  // Pending demand without an explicit purpose is treated as buy.
  return "buy";
}

/**
 * @param {unknown} raw
 * @returns {{ city: string, district: string, subDistrict: string, project: string }[]}
 */
function extractLocations(raw) {
  if (!raw || typeof raw !== "object") return [];
  const row = /** @type {Record<string, unknown>} */ (raw);
  const preferred = row.preferred_locations;
  const out = [];

  if (Array.isArray(preferred)) {
    for (const loc of preferred) {
      if (!loc || typeof loc !== "object") continue;
      const entry = /** @type {Record<string, unknown>} */ (loc);
      const city = pickString(entry.city).toLowerCase();
      const district = pickString(entry.district).toLowerCase();
      const subDistrict = pickString(
        entry.sub_district,
        entry.subDistrict,
      ).toLowerCase();
      const project = pickString(entry.project);
      if (!city && !district && !subDistrict && !project) continue;
      out.push({ city, district, subDistrict, project });
    }
  }

  if (out.length === 0) {
    const city = pickString(row.city).toLowerCase();
    const district = pickString(row.district).toLowerCase();
    const subDistrict = pickString(
      row.sub_district,
      row.subDistrict,
    ).toLowerCase();
    const project = pickString(row.project);
    if (city || district || subDistrict || project) {
      out.push({ city, district, subDistrict, project });
    }
  }

  return out;
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
function extractPropertyTypes(raw) {
  if (!raw || typeof raw !== "object") return [];
  const row = /** @type {Record<string, unknown>} */ (raw);
  const types = [];
  const preferred = row.preferred_property_types;
  if (Array.isArray(preferred)) {
    for (const value of preferred) {
      const t = pickString(value).toLowerCase();
      if (t && !types.includes(t)) types.push(t);
    }
  }
  const single = pickString(
    row.buildingType,
    row.building_type,
    row.property_type,
  ).toLowerCase();
  if (single && !types.includes(single)) types.push(single);
  return types;
}

/**
 * Detect leftover PII strings that must never reach the browser.
 * @param {string} value
 */
function looksLikePiiToken(value) {
  const v = String(value || "").trim();
  if (!v) return false;
  if (/@/.test(v)) return true;
  if (/^\+?\d[\d\s\-()]{7,}$/.test(v)) return true;
  return false;
}

/** Strip emails / phone-like tokens from free-text before public display. */
export function scrubPublicNoteText(value) {
  let text = String(value || "").replace(/\r\n/g, "\n").trim();
  if (!text) return "";
  text = text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "");
  text = text.replace(/(?:\+?\d[\d\s\-()]{7,}\d)/g, "");
  text = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return text;
}

/**
 * Buyer-facing free text lives mainly in `additionalFeatures` (array of strings).
 * Never pulls lead.query / matched_units_comment / assigned CRM chatter.
 * @param {unknown} raw
 * @returns {string}
 */
export function extractPublicNotes(raw) {
  if (!raw || typeof raw !== "object") return "";
  const row = /** @type {Record<string, unknown>} */ (raw);
  const chunks = [];

  const features = row.additionalFeatures ?? row.additional_features;
  if (Array.isArray(features)) {
    for (const item of features) {
      const part = scrubPublicNoteText(item);
      if (part) chunks.push(part);
    }
  } else {
    const part = scrubPublicNoteText(features);
    if (part) chunks.push(part);
  }

  // Optional single notes field on the requirement itself (not lead notes).
  const notes = scrubPublicNoteText(row.notes);
  if (notes && !chunks.includes(notes)) chunks.push(notes);

  return chunks.join("\n").trim().slice(0, 600);
}

/**
 * @typedef {object} PublicRequirementLocation
 * @property {string} city
 * @property {string} district
 * @property {string} subDistrict
 * @property {string} project
 *
 * @typedef {object} PublicRequirement
 * @property {string} id
 * @property {"buy"} intent
 * @property {PublicRequirementLocation[]} locations
 * @property {string[]} propertyTypes
 * @property {number} [roomsCount]
 * @property {number} [minPrice]
 * @property {number} [maxPrice]
 * @property {number} [downPayment]
 * @property {number} [monthlyInstallment]
 * @property {string} [deliveryDate]
 * @property {string} [developer]
 * @property {string} [notes]
 */

/**
 * Explicit allowlist. CRM lead contact, assigned_to, ids, scores,
 * matched units, and other operational fields are dropped.
 *
 * @param {unknown} raw
 * @returns {PublicRequirement | null}
 */
export function toPublicRequirement(raw) {
  if (!raw || typeof raw !== "object") return null;
  const row = /** @type {Record<string, unknown>} */ (raw);

  const intent = resolvePublicIntent(row);
  if (!intent) return null;

  const locations = extractLocations(row).filter(
    (loc) =>
      !looksLikePiiToken(loc.city) &&
      !looksLikePiiToken(loc.district) &&
      !looksLikePiiToken(loc.project),
  );
  if (locations.length === 0) return null;

  const propertyTypes = extractPropertyTypes(row);
  const roomsCount = pickPositiveInt(row.roomsCount, row.rooms_count, row.bedrooms);
  const minPrice = pickNumber(row.min_price, row.minPrice);
  const maxPrice = pickNumber(row.max_price, row.maxPrice);
  const downPayment = pickNumber(row.downPayment, row.down_payment);
  const monthlyInstallment = pickNumber(
    row.monthlyInstallment,
    row.monthly_installment,
  );
  const deliveryDate = pickString(row.deliveryDate, row.delivery_date);
  const developer = pickString(row.developer);
  const notes = extractPublicNotes(row);

  const hasSignal =
    propertyTypes.length > 0 ||
    roomsCount != null ||
    (minPrice != null && minPrice > 0) ||
    (maxPrice != null && maxPrice > 0) ||
    (downPayment != null && downPayment > 0) ||
    Boolean(deliveryDate) ||
    Boolean(developer) ||
    Boolean(notes);

  // Skip empty "city only" stubs — not useful marketplace cards.
  if (!hasSignal) return null;

  const seed = pickString(row.id, row.requirement_id) || JSON.stringify({
    intent,
    locations,
    propertyTypes,
    roomsCount,
    maxPrice,
    minPrice,
  });
  const id = publicRequirementId(seed);
  if (!id) return null;

  /** @type {PublicRequirement} */
  const publicRow = {
    id,
    intent,
    locations,
    propertyTypes,
  };

  if (roomsCount != null) publicRow.roomsCount = roomsCount;
  if (minPrice != null && minPrice > 0) publicRow.minPrice = minPrice;
  if (maxPrice != null && maxPrice > 0) publicRow.maxPrice = maxPrice;
  if (downPayment != null && downPayment > 0) publicRow.downPayment = downPayment;
  if (monthlyInstallment != null && monthlyInstallment > 0) {
    publicRow.monthlyInstallment = monthlyInstallment;
  }
  if (deliveryDate && !looksLikePiiToken(deliveryDate)) {
    publicRow.deliveryDate = deliveryDate;
  }
  if (developer && !looksLikePiiToken(developer)) {
    publicRow.developer = developer;
  }
  if (notes) publicRow.notes = notes;

  return publicRow;
}

/**
 * Rank richer requirements first for the homepage feed.
 * @param {PublicRequirement} a
 * @param {PublicRequirement} b
 */
export function comparePublicRequirements(a, b) {
  const score = (r) =>
    (r.propertyTypes?.length || 0) * 4 +
    (r.roomsCount ? 3 : 0) +
    (r.maxPrice || r.minPrice ? 3 : 0) +
    (r.downPayment ? 1 : 0) +
    (r.deliveryDate ? 1 : 0) +
    (r.locations?.[0]?.district ? 2 : 0) +
    (r.locations?.[0]?.project ? 1 : 0) +
    (r.notes ? 2 : 0);
  return score(b) - score(a);
}
