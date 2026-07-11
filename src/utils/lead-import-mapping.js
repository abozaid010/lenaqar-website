/**
 * Lead import column mapping.
 *
 * Centralized, framework-free helpers that map arbitrary spreadsheet headers to
 * the lead fields the backend expects. Kept pure (no React / DOM / network) so it
 * can be reused by the import hook and covered by plain `node --test` unit tests.
 *
 * Matching is case-insensitive and ignores spaces, underscores and hyphens.
 * Unknown columns are never dropped — the caller merges them into the lead notes.
 *
 * The API payload keeps its existing field names (see FIELD_TO_API): a logical
 * `notes` column maps to `query`, `name` maps to `user_name`, `phone` maps to
 * `phone_number`. Do not change these without a matching backend change.
 */

/** Logical field -> accepted header aliases (English + Arabic). */
export const LEAD_FIELD_ALIASES = {
  phone: [
    "phone",
    "phone number",
    "mobile",
    "mobile number",
    "mobile_number",
    "telephone",
    "tel",
    "contact",
    "contact number",
    "contact_number",
    "whatsapp",
    "whatsapp number",
    "number",
    "رقم",
    "رقم الهاتف",
    "موبايل",
    "تليفون",
  ],
  name: [
    "name",
    "full name",
    "fullname",
    "user name",
    "username",
    "lead name",
    "lead",
    "client",
    "client name",
    "customer",
    "customer name",
    "اسم",
    "الاسم",
  ],
  notes: [
    "notes",
    "note",
    "query",
    "description",
    "remarks",
    "comment",
    "comments",
    "details",
    "message",
    "ملاحظات",
    "وصف",
  ],
  campaign_id: [
    "campaign",
    "campaign id",
    "campaign_id",
    "campaignid",
    "campaign name",
    "source campaign",
    "source_campaign",
  ],
  platform: ["platform", "source", "lead source", "channel", "origin"],
  author: [
    "author",
    "author email",
    "author_email",
    "authoremail",
    "created by",
    "created_by",
  ],
};

/**
 * Detection priority. Compound/specific fields (campaign) are resolved before
 * fields whose aliases are single generic tokens (platform's "source") so a
 * "source campaign" header is claimed by campaign, not platform.
 */
export const LEAD_FIELD_ORDER = [
  "phone",
  "name",
  "campaign_id",
  "author",
  "notes",
  "platform",
];

/** Logical field -> API payload key. Preserves the existing backend contract. */
export const FIELD_TO_API = {
  name: "user_name",
  phone: "phone_number",
  notes: "query",
  campaign_id: "campaign_id",
  platform: "platform",
  author: "author",
};

/**
 * Normalize a header for matching: lowercase, collapse underscores/hyphens to
 * spaces, collapse repeated whitespace, trim.
 */
export const normalizeHeader = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * True when `alias` appears in `normalizedHeader` as a whole word/phrase
 * (token boundary), avoiding greedy substring matches like "tel" in "hotel".
 */
const headerContainsAlias = (normalizedHeader, normalizedAlias) => {
  if (!normalizedHeader || !normalizedAlias) return false;
  return ` ${normalizedHeader} `.includes(` ${normalizedAlias} `);
};

/**
 * Map every header to a logical field, assigning each column to at most one
 * field and each field to at most one column. Exact matches win over fuzzy
 * (token-contains) matches across all fields.
 *
 * @param {Array<string>} headers - raw header cells, in column order.
 * @returns {{
 *   assignment: Array<{ field: string, alias: string } | null>,
 *   byField: Record<string, number>,
 *   mappedColumns: Array<{ index: number, header: string, field: string, apiField: string, viaAlias: boolean }>,
 *   unknownColumns: Array<{ index: number, header: string }>,
 * }}
 */
export function buildColumnMapping(headers) {
  const safeHeaders = Array.isArray(headers) ? headers : [];
  const normalized = safeHeaders.map(normalizeHeader);
  const assignment = new Array(safeHeaders.length).fill(null);
  const byField = {};

  const assign = (index, field, alias) => {
    assignment[index] = { field, alias };
    byField[field] = index;
  };

  // Iterate columns left-to-right so the leftmost unassigned column wins when a
  // field has several matching headers (e.g. both "Mobile" and "Phone Number").
  const findColumn = (aliases, predicate) => {
    const normalizedAliases = aliases.map(normalizeHeader);
    for (let index = 0; index < normalized.length; index += 1) {
      if (assignment[index] !== null) continue;
      const header = normalized[index];
      const alias = normalizedAliases.find((a) => predicate(header, a));
      if (alias) return { index, alias };
    }
    return null;
  };

  // Phase 1: exact normalized matches (highest precedence).
  for (const field of LEAD_FIELD_ORDER) {
    if (byField[field] !== undefined) continue;
    const match = findColumn(
      LEAD_FIELD_ALIASES[field],
      (header, alias) => header === alias,
    );
    if (match) assign(match.index, field, match.alias);
  }

  // Phase 2: token-contains matches for still-unmapped fields.
  for (const field of LEAD_FIELD_ORDER) {
    if (byField[field] !== undefined) continue;
    const match = findColumn(LEAD_FIELD_ALIASES[field], headerContainsAlias);
    if (match) assign(match.index, field, match.alias);
  }

  const mappedColumns = [];
  const unknownColumns = [];

  safeHeaders.forEach((rawHeader, index) => {
    const header = String(rawHeader ?? "").trim();
    const entry = assignment[index];
    if (entry) {
      mappedColumns.push({
        index,
        header,
        field: entry.field,
        apiField: FIELD_TO_API[entry.field],
        viaAlias: normalizeHeader(header) !== normalizeHeader(entry.field),
      });
    } else if (header) {
      unknownColumns.push({ index, header });
    }
  });

  return { assignment, byField, mappedColumns, unknownColumns };
}

/**
 * Build "Header: value" pairs for the unknown columns of a single row, skipping
 * empty values. Used to merge unrecognized columns into the lead notes.
 */
export function getRowUnknownPairs(row, unknownColumns) {
  const safeRow = Array.isArray(row) ? row : [];
  const columns = Array.isArray(unknownColumns) ? unknownColumns : [];
  const pairs = [];
  for (const { index, header } of columns) {
    const value = String(safeRow[index] ?? "").trim();
    if (!value) continue;
    pairs.push({ header, value });
  }
  return pairs;
}

/**
 * Append generated "Header: value" text to any existing notes, preserving the
 * original note on its own line. Returns the combined notes string.
 */
export function buildMergedNotes(baseNotes, unknownPairs) {
  const pairs = Array.isArray(unknownPairs) ? unknownPairs : [];
  const extra = pairs
    .filter((pair) => String(pair?.value ?? "").trim() !== "")
    .map((pair) => `${pair.header}: ${String(pair.value).trim()}`)
    .join(", ");
  const base = String(baseNotes ?? "").trim();

  if (base && extra) return `${base}\n${extra}`;
  return base || extra;
}

/**
 * True when a cell value looks like a repeated header title for the given field
 * (used to skip stray header rows inside the data).
 */
export function isHeaderLikeValue(value, aliases) {
  const normalized = normalizeHeader(value);
  if (!normalized) return false;
  return (Array.isArray(aliases) ? aliases : []).some(
    (alias) => normalizeHeader(alias) === normalized,
  );
}
