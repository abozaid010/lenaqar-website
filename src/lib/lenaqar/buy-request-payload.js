import { BUILDING_TYPE_VALUES } from "../../data/constants.js";
import { normalizeToEnglishDigits } from "../../utils/parse-amount.js";
import { normalizeBuyRequestDelivery } from "./buy-request-delivery.js";
import {
  MAX_REQUEST_PLACES,
  normalizePlaces,
  placesFromForm,
  primaryPlace,
} from "./request-places.js";

const BUILDING_TYPE_SET = new Set(
  BUILDING_TYPE_VALUES.map((value) => String(value).trim().toLowerCase()),
);

const YEAR_MONTH = /^(\d{4})-(0[1-9]|1[0-2])/;

export function toYearMonth(value) {
  if (value == null || value === "") return "";
  const match = String(normalizeToEnglishDigits(value)).trim().match(YEAR_MONTH);
  return match ? `${match[1]}-${match[2]}` : "";
}

export function parseMoney(value) {
  if (value === "" || value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }
  const n = parseFloat(
    String(normalizeToEnglishDigits(value)).replace(/[^0-9.]/g, ""),
  );
  return Number.isFinite(n) ? n : NaN;
}

function parsePositiveInteger(value) {
  if (value === "" || value == null) return null;
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : NaN;
  }
  const digits = String(normalizeToEnglishDigits(value)).trim();
  if (!/^\d+$/.test(digits)) return NaN;
  const n = Number(digits);
  return Number.isInteger(n) ? n : NaN;
}

function optionalMoney(form, key, errors, errorKey) {
  const raw = form[key];
  if (raw === "" || raw == null) return undefined;
  const n = parseMoney(raw);
  if (!Number.isFinite(n) || n < 0) {
    errors[key] = errorKey;
    return undefined;
  }
  return n;
}

function requiredMoney(form, key, errors, requiredKey, invalidKey) {
  const raw = form[key];
  if (raw === "" || raw == null) {
    errors[key] = requiredKey;
    return undefined;
  }
  const n = parseMoney(raw);
  if (!Number.isFinite(n) || n <= 0) {
    errors[key] = invalidKey;
    return undefined;
  }
  return n;
}

export const BUY_REQUEST_PAYMENT_MODES = ["cash", "installment"];

/**
 * "" means the buyer did not say how they pay: no down payment is asked and no
 * delivery date is assumed.
 * @param {unknown} value
 * @returns {"cash" | "installment" | ""}
 */
export function normalizeBuyRequestPaymentMode(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";
  return raw === "installment" ? "installment" : "cash";
}

/**
 * Infer payment mode when loading a saved requirement (no UI mode stored).
 * A down payment or instalment means instalments; a "ready" delivery with
 * neither is what a cash request stores; anything else was never stated.
 * @param {object | null | undefined} raw
 * @returns {"cash" | "installment" | ""}
 */
export function inferBuyRequestPaymentMode(raw) {
  if (!raw || typeof raw !== "object") return "";
  if (raw.paymentMode != null && String(raw.paymentMode).trim()) {
    return normalizeBuyRequestPaymentMode(raw.paymentMode);
  }
  const down = parseMoney(raw.downPayment);
  const monthly = parseMoney(raw.monthlyInstallment);
  if ((Number.isFinite(down) && down > 0) || (Number.isFinite(monthly) && monthly > 0)) {
    return "installment";
  }
  return normalizeBuyRequestDelivery(raw.deliveryDate) === "ready" ? "cash" : "";
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * GET /public/v1/buy-request/{user_id} returns the stored requirement in the
 * CRM shape: `preferred_locations` (array, newest last) and
 * `preferred_property_types`, not the flat `city` / `district` /
 * `buildingType` the form uses. Fill the flat fields from those so a returning
 * buyer sees their saved location and property type. Flat fields win when the
 * API already sends them.
 * @param {Record<string, unknown> | null | undefined} raw
 */
export function normalizeLoadedBuyRequest(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const out = { ...raw };

  if (!cleanText(out.city)) {
    const locations = Array.isArray(raw.preferred_locations)
      ? raw.preferred_locations.filter(
          (loc) => loc && typeof loc === "object" && cleanText(loc.city),
        )
      : [];
    // Newest, most specific entry: last one with a district, else last with a city.
    const pick =
      [...locations].reverse().find((loc) => cleanText(loc.district)) ||
      locations[locations.length - 1];
    if (pick) {
      out.city = cleanText(pick.city);
      out.district = cleanText(pick.district);
      out.sub_district = cleanText(pick.sub_district);
      if (!cleanText(out.project)) out.project = cleanText(pick.project);
    }
  }

  const hasBuildingType = Array.isArray(out.buildingType)
    ? out.buildingType.some((item) => cleanText(item))
    : cleanText(out.buildingType);
  if (!hasBuildingType && Array.isArray(raw.preferred_property_types)) {
    const types = raw.preferred_property_types.map(cleanText).filter(Boolean);
    if (types.length) out.buildingType = types[0];
  }

  return out;
}

/**
 * The dialog sends the already-built requirement to the server action, which
 * re-validates it with `buildPublicBuyRequirement`. A built requirement has no
 * `paymentMode` and keeps notes under `additionalFeatures`, so re-validating it
 * as-is turned every instalment request into "cash, max price required" and
 * dropped the notes. Recover both before re-validating.
 * @param {Record<string, unknown> | null | undefined} payload
 */
export function formFromBuiltRequirement(payload) {
  if (!payload || typeof payload !== "object") return {};
  const features = payload.additionalFeatures;
  const notes =
    typeof payload.notes === "string"
      ? payload.notes
      : Array.isArray(features)
        ? features.map((item) => String(item || "").trim()).filter(Boolean).join("\n")
        : "";
  const form = {
    ...payload,
    paymentMode: inferBuyRequestPaymentMode(payload),
    notes,
  };
  // A request built from the place picker carries every place here.
  if (Array.isArray(payload.preferred_locations)) {
    form.places = payload.preferred_locations;
  }
  return form;
}

/**
 * Public `/public/v1/buy-request/submit` requirement body.
 * Only the keys the API documents — extra CRM fields are dropped.
 */
export function buildPublicBuyRequirement(form) {
  const errors = {};
  const buildingRaw = String(form?.buildingType || "").trim().toLowerCase();
  const paymentMode = normalizeBuyRequestPaymentMode(form?.paymentMode);

  // Places: the picker's list, or the older single flat city/district. A whole
  // city is a complete place — a district is not required.
  const fromPicker = Array.isArray(form?.places);
  const places = placesFromForm(form);
  if (fromPicker && normalizePlaces(form.places).length > MAX_REQUEST_PLACES) {
    errors.places = "placesLimit";
  } else if (!places.length) {
    if (fromPicker) errors.places = "placeRequired";
    else errors.city = "cityRequired";
  }

  let buildingType;
  if (!buildingRaw) {
    errors.buildingType = "buildingTypeRequired";
  } else if (!BUILDING_TYPE_SET.has(buildingRaw)) {
    errors.buildingType = "buildingTypeInvalid";
  } else {
    buildingType = BUILDING_TYPE_VALUES.find(
      (value) => String(value).trim().toLowerCase() === buildingRaw,
    );
  }

  let roomsCount;
  if (form?.roomsCount !== "" && form?.roomsCount != null) {
    const n = parsePositiveInteger(form.roomsCount);
    if (!Number.isInteger(n) || n <= 0) {
      errors.roomsCount = "invalidRooms";
    } else {
      roomsCount = n;
    }
  }

  const max_price = requiredMoney(
    form,
    "max_price",
    errors,
    "maxPriceRequired",
    "invalidNumber",
  );
  let downPayment;
  let monthlyInstallment;
  let deliveryDate;

  if (paymentMode === "cash") {
    // Cash buyers want a delivered unit by default.
    deliveryDate = "ready";
  } else if (paymentMode === "installment") {
    downPayment = requiredMoney(
      form,
      "downPayment",
      errors,
      "downPaymentRequired",
      "invalidNumber",
    );
    monthlyInstallment = optionalMoney(
      form,
      "monthlyInstallment",
      errors,
      "invalidNumber",
    );
    if (form?.deliveryDate !== "" && form?.deliveryDate != null) {
      const token = normalizeBuyRequestDelivery(form.deliveryDate);
      if (!token) {
        errors.deliveryDate = "invalidDeliveryDate";
      } else {
        deliveryDate = token;
      }
    }
  }

  let notes = String(form?.notes || "").trim();
  if (notes.length > 1000) {
    errors.notes = "notesTooLong";
    notes = "";
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  const requirement = { purpose: "buy", buildingType };
  // Flat fields describe the first place with a city; single-place readers
  // (analytics, the browse link, the WhatsApp fallback) use them.
  const primary = primaryPlace(places);
  if (primary) {
    requirement.city = primary.city;
    if (primary.district) requirement.district = primary.district;
    if (primary.project) requirement.project = primary.project;
  }
  if (fromPicker) {
    // Every place, in the backend's LocationPreference shape.
    requirement.preferred_locations = places.map((place) => ({
      city: place.city || null,
      district: place.district || null,
      sub_district: place.sub_district || null,
      project: place.project || null,
    }));
  }
  if (roomsCount != null) requirement.roomsCount = roomsCount;
  if (max_price != null) requirement.max_price = max_price;
  if (downPayment != null) requirement.downPayment = downPayment;
  if (monthlyInstallment != null) {
    requirement.monthlyInstallment = monthlyInstallment;
  }
  if (deliveryDate) requirement.deliveryDate = deliveryDate;
  // Public API stores free-text notes as additionalFeatures (string[]).
  if (notes) requirement.additionalFeatures = [notes];

  return { ok: true, requirement };
}
