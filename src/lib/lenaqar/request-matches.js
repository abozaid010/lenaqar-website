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
 * @returns {{kind: "match"} | {kind: "closest", labelKey: string, amount: number | null}}
 */
export function matchInfo(raw) {
  if (raw?.match_kind !== "closest") return { kind: "match" };
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
