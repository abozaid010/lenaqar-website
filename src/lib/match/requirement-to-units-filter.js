/**
 * Maps lead requirement objects to /public/units query params.
 * Purpose-aware pricing; rent daily vs monthly are mutually exclusive.
 */

export const MATCH_UNITS_PAGE_SIZE = 6;

function pickLast(v) {
  if (Array.isArray(v)) {
    const filtered = v.filter((item) => item != null && item !== "");
    if (!filtered.length) return null;
    return String(filtered[filtered.length - 1]);
  }
  if (v == null || v === "") return null;
  return String(v);
}

function pickEnumValue(v) {
  const raw = pickLast(v);
  if (raw == null) return null;
  if (typeof raw === "object" && raw !== null && "value" in raw) {
    return raw.value;
  }
  return String(raw);
}

function toPositiveInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function toPositiveNumber(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Location / enum string filters must match API storage (lowercase). */
function normalizeFilterString(value) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  return s ? s.toLowerCase() : null;
}

/** Query keys sent to /public/units that must be lowercase before iteration. */
export const LOWERCASE_UNIT_FILTER_KEYS = new Set([
  "city",
  "district",
  "project_name",
  "developer_name",
  "purpose",
  "property_type",
  "country",
]);

function applyPriceFilters(filters, requirement, purpose) {
  const p = String(purpose || "").toLowerCase();
  const minPrice = toPositiveNumber(requirement.min_price);
  const maxPrice = toPositiveNumber(requirement.max_price);
  const totalPrice = toPositiveNumber(requirement.totalPrice);
  const dailyMin = toPositiveNumber(requirement.daily_min_price);
  const dailyMax = toPositiveNumber(requirement.daily_max_price);
  const monthlyInstallment = toPositiveNumber(requirement.monthlyInstallment);

  if (p === "rent") {
    const hasDaily = dailyMin != null || dailyMax != null;
    if (hasDaily) {
      if (dailyMin != null) filters.daily_min_price = dailyMin;
      if (dailyMax != null) filters.daily_max_price = dailyMax;
      return;
    }
    if (minPrice != null) filters.min_price = minPrice;
    if (maxPrice != null) filters.max_price = maxPrice;
    if (totalPrice != null && maxPrice == null && minPrice == null) {
      filters.max_price = totalPrice;
    }
    if (monthlyInstallment != null) {
      filters.monthly_installment = monthlyInstallment;
    }
    return;
  }

  if (p === "buy" || p === "sell") {
    if (minPrice != null) filters.min_price = minPrice;
    if (maxPrice != null) filters.max_price = maxPrice;
    if (totalPrice != null && maxPrice == null && minPrice == null) {
      filters.max_price = totalPrice;
    }
  }
}

/**
 * @param {Record<string, unknown>} requirement
 * @param {string} clientId
 * @returns {Record<string, string | number | boolean>}
 */
export function requirementToUnitsFilter(requirement, clientId) {
  if (!requirement || typeof requirement !== "object") return {};

  const purpose = pickEnumValue(requirement.purpose ?? requirement.propertyPurpose);
  const filters = { page_size: MATCH_UNITS_PAGE_SIZE };

  if (clientId) filters.client_id = clientId;

  const city = normalizeFilterString(requirement.city);
  if (city) filters.city = city;

  const district = normalizeFilterString(requirement.district);
  if (district) filters.district = district;

  const project = normalizeFilterString(requirement.project);
  if (project) filters.project_name = project;

  const developer = normalizeFilterString(requirement.developer);
  if (developer) filters.developer_name = developer;

  const buildingType = normalizeFilterString(pickEnumValue(requirement.buildingType));
  if (buildingType) filters.property_type = buildingType;

  const purposeNorm = normalizeFilterString(purpose);
  if (purposeNorm) filters.purpose = purposeNorm;

  const bedrooms = toPositiveInt(requirement.roomsCount);
  if (bedrooms != null) filters.bedrooms = bedrooms;

  const bathrooms = toPositiveInt(requirement.bathroomCount);
  if (bathrooms != null) filters.bathrooms = bathrooms;

  const floor = toPositiveInt(requirement.floor);
  if (floor != null) filters.floor = floor;

  const deliveryDate = requirement.deliveryDate;
  if (deliveryDate) filters.delivery_date = String(deliveryDate).trim();

  const downPayment = toPositiveNumber(requirement.downPayment);
  if (downPayment != null) filters.down_payment = downPayment;

  applyPriceFilters(filters, requirement, purpose);

  return filters;
}

function formatPriceChip(value) {
  const n = toPositiveNumber(value);
  return n != null ? String(n) : null;
}

/**
 * Push purpose-aware price chips for lead requirement summary (one chip per field).
 * @param {Record<string, unknown>} requirement
 * @param {(chip: { key: string, label: string, value: string }) => void} push
 * @param {{ translate: (key: string, fallback?: string) => string, formatPrice: (n: number) => string }} opts
 */
export function appendRequirementPriceChips(requirement, push, { translate, formatPrice }) {
  const purpose = pickEnumValue(requirement.purpose ?? requirement.propertyPurpose);
  const p = String(purpose || "").toLowerCase();

  const fmt = (value) => {
    const n = toPositiveNumber(value);
    return n != null ? formatPrice(n) : null;
  };

  const minP = fmt(requirement.min_price);
  const maxP = fmt(requirement.max_price);
  const totalP = fmt(requirement.totalPrice);
  const dailyMin = fmt(requirement.daily_min_price);
  const dailyMax = fmt(requirement.daily_max_price);
  const monthly = fmt(requirement.monthlyInstallment);
  const down = fmt(requirement.downPayment);
  const service = fmt(requirement.serviceCharges);

  const hasDaily = dailyMin != null || dailyMax != null;

  if (p === "rent") {
    if (hasDaily) {
      if (dailyMin != null) {
        push({
          key: "daily_min_price",
          label: translate(
            "dashboard.requirementsDialog.fields.minDailyRent",
            "Min daily rent",
          ),
          value: dailyMin,
        });
      }
      if (dailyMax != null) {
        push({
          key: "daily_max_price",
          label: translate(
            "dashboard.requirementsDialog.fields.maxDailyRent",
            "Max daily rent",
          ),
          value: dailyMax,
        });
      }
    } else {
      if (minP != null) {
        push({
          key: "min_price",
          label: translate(
            "dashboard.requirementsDialog.fields.minMonthlyRent",
            "Min monthly rent",
          ),
          value: minP,
        });
      }
      if (maxP != null) {
        push({
          key: "max_price",
          label: translate(
            "dashboard.requirementsDialog.fields.maxMonthlyRent",
            "Max monthly rent",
          ),
          value: maxP,
        });
      }
      if (totalP != null) {
        push({
          key: "totalPrice",
          label: translate(
            "dashboard.requirementsDialog.fields.singleMonthlyRent",
            "Monthly rent",
          ),
          value: totalP,
        });
      }
      if (monthly != null) {
        push({
          key: "monthlyInstallment",
          label: translate(
            "dashboard.requirementsDialog.fields.monthly",
            "Monthly installment",
          ),
          value: monthly,
        });
      }
    }
  } else if (p === "buy" || p === "sell") {
    if (minP != null) {
      push({
        key: "min_price",
        label: translate(
          "dashboard.requirementsDialog.fields.minBudget",
          "Min budget",
        ),
        value: minP,
      });
    }
    if (maxP != null) {
      push({
        key: "max_price",
        label: translate(
          "dashboard.requirementsDialog.fields.maxBudget",
          "Max budget",
        ),
        value: maxP,
      });
    }
    if (totalP != null) {
      push({
        key: "totalPrice",
        label: translate(
          "dashboard.requirementsDialog.fields.singleBudget",
          "Budget",
        ),
        value: totalP,
      });
    }
    if (down != null) {
      push({
        key: "downPayment",
        label: translate(
          "dashboard.requirementsDialog.fields.downPayment",
          "Down payment",
        ),
        value: down,
      });
    }
  } else {
    if (minP != null) {
      push({
        key: "min_price",
        label: translate(
          "dashboard.requirementsDialog.fields.minBudget",
          "Min price",
        ),
        value: minP,
      });
    }
    if (maxP != null) {
      push({
        key: "max_price",
        label: translate(
          "dashboard.requirementsDialog.fields.maxBudget",
          "Max price",
        ),
        value: maxP,
      });
    }
    if (totalP != null) {
      push({
        key: "totalPrice",
        label: translate(
          "dashboard.requirementsDialog.fields.totalPrice",
          "Total price",
        ),
        value: totalP,
      });
    }
  }

  if (service != null) {
    push({
      key: "serviceCharges",
      label: translate(
        "dashboard.requirementsDialog.fields.service",
        "Service charges",
      ),
      value: service,
    });
  }
}

/**
 * Human-readable filter chips for UI (max ~2 lines).
 */
export function requirementToFilterChips(requirement, translate = (k, fb) => fb || k) {
  if (!requirement) return [];

  const chips = [];
  const push = (label, value) => {
    if (value != null && String(value).trim()) {
      chips.push({ label, value: String(value).trim() });
    }
  };

  const purpose = pickEnumValue(requirement.purpose ?? requirement.propertyPurpose);
  if (purpose) {
    push(
      translate("dashboard.requirementsDialog.fields.purpose", "Purpose"),
      translate(`propertyPurpose.${purpose}`, purpose),
    );
  }

  const location = [requirement.city, requirement.district, requirement.project]
    .filter((p) => p != null && String(p).trim())
    .map((p) => String(p).trim());
  if (location.length) {
    push(translate("propertyDetails.location", "Location"), location.join(" • "));
  }

  const buildingType = pickEnumValue(requirement.buildingType);
  if (buildingType) {
    push(
      translate("dashboard.requirementsDialog.fields.buildingType", "Building Type"),
      buildingType,
    );
  }

  const rooms = toPositiveInt(requirement.roomsCount);
  if (rooms != null) {
    push(translate("dashboard.requirementsDialog.fields.rooms", "Rooms"), String(rooms));
  }

  const p = String(purpose || "").toLowerCase();
  const minP = formatPriceChip(requirement.min_price);
  const maxP = formatPriceChip(requirement.max_price);
  const dailyMin = formatPriceChip(requirement.daily_min_price);
  const dailyMax = formatPriceChip(requirement.daily_max_price);
  const totalP = formatPriceChip(requirement.totalPrice);

  if (p === "rent") {
    if (dailyMin != null || dailyMax != null) {
      if (dailyMin != null && dailyMax != null) {
        push(
          translate("dashboard.requirementsDialog.fields.dailyRent", "Daily rent"),
          `${dailyMin} – ${dailyMax}`,
        );
      } else if (dailyMax != null) {
        push(
          translate("dashboard.requirementsDialog.fields.dailyRentUpTo", "Daily rent up to"),
          dailyMax,
        );
      } else if (dailyMin != null) {
        push(
          translate("dashboard.requirementsDialog.fields.dailyRentFrom", "Daily rent from"),
          dailyMin,
        );
      }
    } else {
      if (minP != null && maxP != null) {
        push(
          translate("dashboard.requirementsDialog.fields.monthlyRent", "Monthly rent"),
          `${minP} – ${maxP}`,
        );
      } else if (maxP != null) {
        push(
          translate("dashboard.requirementsDialog.fields.monthlyRentUpTo", "Monthly rent up to"),
          maxP,
        );
      } else if (totalP != null) {
        push(
          translate("dashboard.requirementsDialog.fields.monthlyRentUpTo", "Monthly rent up to"),
          totalP,
        );
      }
    }
  } else if (p === "buy" || p === "sell") {
    if (minP != null && maxP != null) {
      push(
        translate("dashboard.requirementsDialog.fields.budget", "Budget"),
        `${minP} – ${maxP}`,
      );
    } else if (maxP != null) {
      push(
        translate("dashboard.requirementsDialog.fields.budgetUpTo", "Budget up to"),
        maxP,
      );
    } else if (totalP != null) {
      push(
        translate("dashboard.requirementsDialog.fields.budgetUpTo", "Budget up to"),
        totalP,
      );
    }
  }

  return chips;
}
