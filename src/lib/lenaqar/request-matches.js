/**
 * Match page helpers: what a card says about how it relates to the buyer's
 * request, and the request summary shown above the cards.
 *
 * The backend (`GET /public/v1/buy-request/match/{ref}`) labels each near miss
 * with the hard rule it breaks (`miss`) and how far above the stated money
 * limits it is (`over_by`).
 */
import { placesFromRequirement } from "./request-places.js";

const MISS_LABEL_KEYS = {
  over_price_cap: "overPrice",
  over_down_payment_cap: "overDownPayment",
  location_mismatch: "location",
  after_delivery_deadline: "delivery",
  below_area_floor: "area",
  below_rooms_floor: "rooms",
};

function positive(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * How a unit relates to the request, for its badge.
 * @param {object} raw unit as the backend sent it
 * @returns {{kind: "match"} | {kind: "closest", labelKey: string, amount: number | null, months?: number}}
 */
export function matchInfo(raw) {
  if (raw?.match_kind !== "closest") return { kind: "match" };
  // A later handover says by how much: the shortest delays are offered first.
  const late = (Array.isArray(raw.trade_offs) ? raw.trade_offs : []).find(
    (tradeOff) => tradeOff?.kind === "late_delivery" && positive(tradeOff.delay_days),
  );
  if (late && raw.miss === "after_delivery_deadline") {
    return {
      kind: "closest",
      labelKey: "delivery",
      amount: null,
      months: Math.max(1, Math.round(late.delay_days / 30)),
    };
  }
  const labelKey = MISS_LABEL_KEYS[raw.miss] || "other";
  const amount =
    labelKey === "overPrice"
      ? positive(raw.over_by?.total_price)
      : labelKey === "overDownPayment"
        ? positive(raw.over_by?.down_payment)
        : null;
  // An amount-based label with no amount would print a broken sentence.
  if ((labelKey === "overPrice" || labelKey === "overDownPayment") && amount == null) {
    return { kind: "closest", labelKey: "other", amount: null };
  }
  return { kind: "closest", labelKey, amount };
}

const UNKNOWN_FIELDS = ["delivery", "down_payment", "rooms", "project"];

/**
 * What the buyer asked about that this unit does not record (label keys), so the
 * card says so instead of implying it fits.
 * @param {object} raw unit as the backend sent it
 * @returns {string[]}
 */
export function unknownFields(raw) {
  const unknown = Array.isArray(raw?.unknown) ? raw.unknown : [];
  return UNKNOWN_FIELDS.filter((field) => unknown.includes(field));
}

const SUGGESTION_KEYS = {
  max_price: "maxPrice",
  downPayment: "downPayment",
  roomsCount: "rooms",
  land_area: "area",
  precise_location: "preciseLocation",
};
const MONEY_SUGGESTIONS = new Set(["maxPrice", "downPayment"]);

/**
 * The one change to the request that would show the most units, when nothing fits.
 * @param {unknown} suggestion backend `suggestion` ({field, value, unlocks})
 * @returns {{labelKey: string, value: number | null, isMoney: boolean, count: number} | null}
 */
export function requestSuggestion(suggestion) {
  if (!suggestion || typeof suggestion !== "object") return null;
  const labelKey = SUGGESTION_KEYS[suggestion.field];
  const count = positive(suggestion.unlocks);
  if (!labelKey || !count) return null;
  const value = labelKey === "preciseLocation" ? null : positive(suggestion.value);
  if (labelKey !== "preciseLocation" && value == null) return null;
  return { labelKey, value, isMoney: MONEY_SUGGESTIONS.has(labelKey), count: Math.floor(count) };
}

/**
 * The buyer's own request, reduced to what the summary row shows.
 * @param {object | null | undefined} requirement public snapshot from the backend
 */
export function requestSummary(requirement) {
  const req = requirement && typeof requirement === "object" ? requirement : {};
  const types = Array.isArray(req.preferred_property_types)
    ? req.preferred_property_types.map((type) => String(type || "").trim()).filter(Boolean)
    : [];
  return {
    places: placesFromRequirement(req),
    propertyTypes: types,
    maxPrice: positive(req.max_price),
    downPayment: positive(req.downPayment),
    rooms: positive(req.roomsCount),
  };
}

// The backend's own "no such request" answer. Any other 404 means the route is
// not there (an older backend): the request exists, the units just cannot be shown.
const REQUEST_NOT_FOUND = "Request not found";

/**
 * True when a 404 body says the request itself does not exist. Production wraps
 * errors as `{ status, code, error_message }`; a bare FastAPI app sends `{ detail }`.
 * @param {unknown} body parsed JSON of the 404 response
 */
export function isRequestNotFound(body) {
  if (!body || typeof body !== "object") return false;
  return body.error_message === REQUEST_NOT_FOUND || body.detail === REQUEST_NOT_FOUND;
}
