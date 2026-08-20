import { BUILDING_TYPE_VALUES } from "../../data/constants.js";
import { normalizeToEnglishDigits } from "../../utils/parse-amount.js";

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

/**
 * Public `/public/v1/buy-request/submit` requirement body.
 * Only the keys the API documents — extra CRM fields are dropped.
 */
export function buildPublicBuyRequirement(form) {
  const errors = {};
  const city = String(form?.city || "").trim().toLowerCase();
  const district = String(form?.district || "").trim().toLowerCase();
  const buildingRaw = String(form?.buildingType || "").trim().toLowerCase();

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

  const max_price = requiredMoney(
    form,
    "max_price",
    errors,
    "maxPriceRequired",
    "invalidNumber",
  );

  let roomsCount;
  if (form?.roomsCount !== "" && form?.roomsCount != null) {
    const n = parsePositiveInteger(form.roomsCount);
    if (!Number.isInteger(n) || n <= 0) {
      errors.roomsCount = "invalidRooms";
    } else {
      roomsCount = n;
    }
  }

  const downPayment = optionalMoney(
    form,
    "downPayment",
    errors,
    "invalidNumber",
  );
  const monthlyInstallment = optionalMoney(
    form,
    "monthlyInstallment",
    errors,
    "invalidNumber",
  );
  const overPrice = optionalMoney(form, "overPrice", errors, "invalidNumber");

  let deliveryDate;
  if (form?.deliveryDate !== "" && form?.deliveryDate != null) {
    const ym = toYearMonth(form.deliveryDate);
    if (!ym) {
      errors.deliveryDate = "invalidDeliveryDate";
    } else {
      deliveryDate = ym;
    }
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  const project = String(form?.project || "").trim();

  const requirement = {
    city,
    district,
    buildingType,
    max_price,
  };
  if (project) requirement.project = project;
  if (roomsCount != null) requirement.roomsCount = roomsCount;
  if (downPayment != null) requirement.downPayment = downPayment;
  if (monthlyInstallment != null) requirement.monthlyInstallment = monthlyInstallment;
  if (overPrice != null) requirement.overPrice = overPrice;
  if (deliveryDate) requirement.deliveryDate = deliveryDate;

  return { ok: true, requirement };
}
