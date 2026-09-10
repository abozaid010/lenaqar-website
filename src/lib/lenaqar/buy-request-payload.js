import { BUILDING_TYPE_VALUES } from "../../data/constants.js";
import { normalizeToEnglishDigits } from "../../utils/parse-amount.js";
import { normalizeBuyRequestDelivery } from "./buy-request-delivery.js";

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
 * @param {unknown} value
 * @returns {"cash" | "installment"}
 */
export function normalizeBuyRequestPaymentMode(value) {
  const raw = String(value || "").trim().toLowerCase();
  return raw === "installment" ? "installment" : "cash";
}

/**
 * Infer payment mode when loading a saved requirement (no UI mode stored).
 * @param {object | null | undefined} raw
 * @returns {"cash" | "installment"}
 */
export function inferBuyRequestPaymentMode(raw) {
  if (!raw || typeof raw !== "object") return "cash";
  if (raw.paymentMode != null && String(raw.paymentMode).trim()) {
    return normalizeBuyRequestPaymentMode(raw.paymentMode);
  }
  const down = parseMoney(raw.downPayment);
  const monthly = parseMoney(raw.monthlyInstallment);
  if ((Number.isFinite(down) && down > 0) || (Number.isFinite(monthly) && monthly > 0)) {
    return "installment";
  }
  return "cash";
}

/**
 * Public `/public/v1/buy-request/submit` requirement body.
 * Only the keys the API documents — extra CRM fields are dropped.
 */
export function buildPublicBuyRequirement(form) {
  const errors = {};
  const city = String(form?.city || "").trim().toLowerCase();
  const district = String(form?.district || "").trim().toLowerCase();
  const buildingRaw = String(form?.buildingType || "").trim().toLowerCase();
  const paymentMode = normalizeBuyRequestPaymentMode(form?.paymentMode);

  if (!city) errors.city = "cityRequired";
  if (!district) errors.district = "districtRequired";

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

  let max_price;
  let downPayment;
  let monthlyInstallment;
  let deliveryDate;

  if (paymentMode === "cash") {
    max_price = requiredMoney(
      form,
      "max_price",
      errors,
      "maxPriceRequired",
      "invalidNumber",
    );
    // Cash buyers want a delivered unit by default.
    deliveryDate = "ready";
  } else {
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
    max_price = optionalMoney(form, "max_price", errors, "invalidNumber");
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

  const project = String(form?.project || "").trim();

  const requirement = {
    city,
    district,
    buildingType,
  };
  if (project) requirement.project = project;
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
