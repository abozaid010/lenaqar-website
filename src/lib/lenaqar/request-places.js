/**
 * Places of a buy request: the default chips, the typed search, and the shape
 * sent to the backend (`preferred_locations`).
 *
 * A place is `{ city?, district?, sub_district?, project? }`. `city`,
 * `district` and `sub_district` are catalog tokens (lowercase `en_name` from
 * GET /api/locations/catalog) — matching compares them to a unit's fields with
 * `==`, so a chip must carry the exact token. A place the buyer typed that the
 * catalog does not know is `{ project: "<their text>" }`: saved for the team,
 * never a filter.
 */

export const MAX_REQUEST_PLACES = 5;
export const MAX_PLACE_TEXT_LENGTH = 80;
const MIN_SEARCH_LENGTH = 2;

/**
 * The areas offered as one-tap chips, in display order. Tokens audited against
 * the live catalog on 2026-11-19: five are cities, four are districts.
 * `labelKey` is under `lenaqar.buyRequest.placeChips`.
 */
export const DEFAULT_REQUEST_PLACES = [
  { labelKey: "cairo", city: "cairo" },
  { labelKey: "newCairo", city: "new cairo" },
  { labelKey: "sheikhZayed", city: "sheikh zayed" },
  { labelKey: "october", city: "6 october" },
  { labelKey: "madinaty", city: "new cairo", district: "madinaty" },
  { labelKey: "newCapital", city: "new administrative capital" },
  { labelKey: "fifthSettlement", city: "new cairo", district: "fifth settlement" },
  { labelKey: "shorouk", city: "cairo", district: "el shorouk city" },
  { labelKey: "firstSettlement", city: "new cairo", district: "first settlement" },
];

function token(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function text(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

/**
 * One clean place, or null when it names nothing usable or a value is too long.
 * @param {unknown} raw
 */
export function cleanPlace(raw) {
  if (!raw || typeof raw !== "object") return null;
  const place = {};
  for (const field of ["city", "district", "sub_district"]) {
    const value = token(raw[field]);
    if (value) place[field] = value;
  }
  const project = text(raw.project);
  if (project) place.project = project;
  if (!place.city && !place.project) return null;
  if (Object.values(place).some((value) => value.length > MAX_PLACE_TEXT_LENGTH)) {
    return null;
  }
  return place;
}

/** Identity of a place: two selections of the same spot share a key. */
export function placeKey(place) {
  return ["city", "district", "sub_district", "project"]
    .map((field) => token(place?.[field]))
    .join("|");
}

/** A place that is a whole city (no district, no project). */
export function isWholeCity(place) {
  return Boolean(place?.city) && !place.district && !place.sub_district && !place.project;
}

/** True when `place` sits inside a city that is selected as a whole. */
export function isCoveredByCity(selected, place) {
  if (!place?.city || isWholeCity(place)) return false;
  return (selected || []).some(
    (other) => isWholeCity(other) && other.city === place.city,
  );
}

export function isSelected(selected, place) {
  const key = placeKey(place);
  return (selected || []).some((other) => placeKey(other) === key);
}

/**
 * Clean, de-duplicated list. A place inside a city that is also selected as a
 * whole is dropped: the city already covers it.
 * @param {unknown} raw
 */
export function normalizePlaces(raw) {
  const out = [];
  const seen = new Set();
  for (const item of Array.isArray(raw) ? raw : []) {
    const place = cleanPlace(item);
    if (!place) continue;
    const key = placeKey(place);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(place);
  }
  return out.filter((place) => !isCoveredByCity(out, place));
}

/**
 * Add a place. Returns `{ places, error }`; `error` is "placesLimit" when the
 * list is full. Adding a whole city removes the places inside it.
 */
export function addPlace(selected, raw) {
  const current = normalizePlaces(selected);
  const place = cleanPlace(raw);
  if (!place) return { places: current, error: "placeInvalid" };
  if (isSelected(current, place) || isCoveredByCity(current, place)) {
    return { places: current, error: "" };
  }
  const next = normalizePlaces([...current, place]);
  if (next.length > MAX_REQUEST_PLACES) {
    return { places: current, error: "placesLimit" };
  }
  return { places: next, error: "" };
}

export function removePlace(selected, place) {
  const key = placeKey(place);
  return normalizePlaces(selected).filter((other) => placeKey(other) !== key);
}

/** Tap on a chip: add it, or remove it when it is already selected. */
export function togglePlace(selected, place) {
  if (isSelected(selected, place)) {
    return { places: removePlace(selected, place), error: "" };
  }
  return addPlace(selected, place);
}

/**
 * The form's places. `form.places` wins; a form that only has the older flat
 * `city` / `district` fields (landing-page presets, saved drafts) is read as
 * one place.
 */
export function placesFromForm(form) {
  if (Array.isArray(form?.places)) return normalizePlaces(form.places);
  return normalizePlaces([
    {
      city: form?.city,
      district: form?.district,
      sub_district: form?.sub_district,
      project: form?.project,
    },
  ]);
}

/** Saved request (`preferred_locations`, or the flat fields) → the form's places. */
export function placesFromRequirement(requirement) {
  if (!requirement || typeof requirement !== "object") return [];
  const stored = normalizePlaces(requirement.preferred_locations);
  if (stored.length) return stored.slice(0, MAX_REQUEST_PLACES);
  return placesFromForm({ ...requirement, places: undefined });
}

/** The first place that names a city — what single-place consumers read. */
export function primaryPlace(places) {
  return (places || []).find((place) => place.city) || null;
}

// --- search -----------------------------------------------------------------

/** Lowercase, and fold the Arabic spellings buyers mix (أ/إ/آ, ة/ه, ى/ي, tashkeel). */
export function searchKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

function names(row) {
  return [row?.ar_name, row?.en_name, ...(row?.aliases || row?.alias || [])]
    .map(searchKey)
    .filter(Boolean);
}

/** 0 = a name starts with the query, 1 = a name contains it, -1 = no match. */
function matchRank(row, query) {
  let rank = -1;
  for (const name of names(row)) {
    if (name.startsWith(query)) return 0;
    if (name.includes(query)) rank = 1;
  }
  return rank;
}

/**
 * Catalog places and projects matching what the buyer typed.
 *
 * @param {string} query
 * @param {{cities?: object[], districts?: object[], subDistricts?: object[], projects?: object[]}} sources
 * @param {{limit?: number}} [options]
 * @returns {{kind: string, place: object, ar: string, en: string, parentAr: string, parentEn: string}[]}
 */
export function searchPlaces(query, sources, { limit = 8 } = {}) {
  const needle = searchKey(query);
  if (needle.length < MIN_SEARCH_LENGTH) return [];
  const { cities = [], districts = [], subDistricts = [], projects = [] } = sources || {};
  const hits = [];
  const push = (kindOrder, kind, row, place, parentAr, parentEn) => {
    const rank = matchRank(row, needle);
    if (rank < 0) return;
    const clean = cleanPlace(place);
    if (!clean) return;
    hits.push({
      order: rank * 10 + kindOrder,
      kind,
      place: clean,
      ar: text(row.ar_name),
      en: text(row.en_name),
      parentAr: text(parentAr),
      parentEn: text(parentEn),
    });
  };

  for (const city of cities) {
    push(0, "city", city, { city: city.en_name }, "", "");
  }
  for (const district of districts) {
    push(
      1,
      "district",
      district,
      { city: district.city_en_name, district: district.en_name },
      district.city_ar_name,
      district.city_en_name,
    );
  }
  for (const project of projects) {
    push(
      2,
      "project",
      project,
      {
        city: project.city,
        district: project.district,
        sub_district: project.sub_district,
        project: project.en_name || project.ar_name,
      },
      "",
      "",
    );
  }
  for (const sub of subDistricts) {
    push(
      3,
      "sub_district",
      sub,
      { city: sub.city_en_name, district: sub.district_value, sub_district: sub.en_name },
      sub.city_ar_name,
      sub.city_en_name,
    );
  }

  const seen = new Set();
  return hits
    .sort((a, b) => a.order - b.order || a.en.length - b.en.length)
    .filter((hit) => {
      const key = placeKey(hit.place);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map(({ order: _order, ...hit }) => hit);
}

/**
 * The typed text as a place of its own — offered when the buyer wants a place
 * the search did not find. Null when the text is too short or too long.
 */
export function typedPlace(query) {
  const value = text(query);
  if (value.length < MIN_SEARCH_LENGTH || value.length > MAX_PLACE_TEXT_LENGTH) return null;
  return { project: value };
}
