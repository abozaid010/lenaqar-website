/**
 * Maps lead requirement objects to /public/units query params.
 * Purpose-aware price: rent -> monthly_installment, buy/sell -> max_price.
 */

function pickLast(v) {
  if (Array.isArray(v)) {
    const filtered = v.filter((item) => item != null && item !== "");
    if (!filtered.length) return null;
    return filtered[filtered.length - 1];
  }
  if (v == null || v === "") return null;
  return v;
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

/**
 * @param {Record<string, unknown>} requirement
 * @param {string} clientId
 * @returns {Record<string, string | number | boolean>}
 */
export function requirementToUnitsFilter(requirement, clientId) {
  if (!requirement || typeof requirement !== "object") return {};

  const purpose = pickEnumValue(requirement.purpose ?? requirement.propertyPurpose);
  const filters = {};

  if (clientId) filters.client_id = clientId;

  const city = requirement.city;
  if (city) filters.city = String(city).trim();

  const district = requirement.district;
  if (district) {
    filters.district = String(district).trim();
  }

  const project = requirement.project;
  if (project) filters.project_name = String(project).trim();

  const developer = requirement.developer;
  if (developer) filters.developer_name = String(developer).trim();

  const buildingType = pickEnumValue(requirement.buildingType);
  if (buildingType) filters.property_type = buildingType;

  if (purpose) filters.purpose = purpose;

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

  const monthlyInstallment = toPositiveNumber(requirement.monthlyInstallment);
  if (monthlyInstallment != null) {
    filters.monthly_installment = monthlyInstallment;
  }

  const totalPrice = toPositiveNumber(requirement.totalPrice);
  if (totalPrice != null) {
    const p = String(purpose || "").toLowerCase();
    if (p === "rent") {
      filters.monthly_installment = totalPrice;
    } else {
      filters.max_price = totalPrice;
    }
  }

  return filters;
}

/**
 * Human-readable filter chips for UI (max ~2 lines).
 * @param {Record<string, unknown>} requirement
 * @param {(key: string, fallback?: string) => string} translate
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

  const baths = toPositiveInt(requirement.bathroomCount);
  if (baths != null) {
    push(translate("dashboard.requirementsDialog.fields.baths", "Baths"), String(baths));
  }

  const totalPrice = toPositiveNumber(requirement.totalPrice);
  if (totalPrice != null) {
    const label =
      String(purpose || "").toLowerCase() === "rent"
        ? translate("dashboard.requirementsDialog.fields.monthly", "Monthly")
        : translate("dashboard.requirementsDialog.fields.totalPrice", "Budget");
    push(label, String(totalPrice));
  }

  return chips;
}
