/**
 * Which Buyer Guide area matches a public listing.
 *
 * The feed sends `district` and `city` as lowercase English tokens (see
 * `PLACES_AR` in `src/lib/lenaqar/listing-seo.js`). Only exact, known tokens
 * map to a guide area: an unknown place gets no guide link rather than a
 * guessed one. District wins over city ("madinaty" inside "new cairo").
 */
const GUIDE_AREA_BY_PLACE = {
  madinaty: "madinaty",
  "el shorouk": "el-shorouk",
  "el shorouk city": "el-shorouk",
  "mostakbal city": "mostakbal-city",
  "mostaqbal city": "mostakbal-city",
  "fifth settlement": "fifth-settlement",
  "new cairo": "new-cairo",
  "sheikh zayed": "sheikh-zayed",
  "6th of october": "6th-of-october",
  "sixth of october": "6th-of-october",
  "6 october": "6th-of-october",
  "6 october city": "6th-of-october",
};

function placeToken(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** Guide area id (e.g. "madinaty") for a listing, or null. */
export function guideAreaForUnit(unit) {
  for (const place of [unit?.district, unit?.city]) {
    const area = GUIDE_AREA_BY_PLACE[placeToken(place)];
    if (area) return area;
  }
  return null;
}

/**
 * Candidate guide hrefs for a listing, most specific first: the area price
 * map, then the area hub. Callers filter them to indexable guides.
 */
export function areaGuideHrefsForUnit(unit) {
  const area = guideAreaForUnit(unit);
  if (!area) return [];
  return [`/guides/${area}/prices-2026`, `/guides/${area}`];
}
