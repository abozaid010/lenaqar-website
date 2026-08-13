function pickString(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickNumber(...vals) {
  for (const v of vals) {
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickBool(...vals) {
  for (const v of vals) {
    if (v === true || v === false) return v;
  }
  return null;
}

function mapImages(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const img of raw) {
    const url =
      typeof img === "string"
        ? img.trim()
        : pickString(img?.url, img?.image_url);
    if (url) out.push({ url });
  }
  return out;
}

/**
 * Explicit field allowlist. author, notes, extra_info, visibility,
 * dataSource, cache_price, owner_* never cross into the browser payload.
 *
 * isPrimary is included so the feed can label primary vs resale (§2.2).
 * developerAr / projectAr are included so the network token filter and
 * Arabic display can use the names the API actually sends.
 */
export function toPublicOpportunity(raw) {
  if (!raw || typeof raw !== "object") return null;

  const code = pickString(raw.code);
  if (!code) return null;

  return {
    code,
    unitTitle: pickString(raw.unitTitle, raw.unit_title),
    project: pickString(raw.project),
    projectAr: pickString(raw.project_ar, raw.projectAr),
    developer: pickString(raw.developer),
    developerAr: pickString(raw.developer_ar, raw.developerAr),
    city: pickString(raw.city),
    district: pickString(raw.district),
    subDistrict: pickString(raw.sub_district, raw.subDistrict),
    buildingType: pickString(raw.buildingType, raw.building_type, raw.property_type),
    roomsCount: pickNumber(raw.roomsCount, raw.rooms_count, raw.bedrooms),
    bathroomCount: pickNumber(raw.bathroomCount, raw.bathroom_count),
    landArea: pickNumber(raw.landArea, raw.land_area, raw.area),
    floor: pickString(raw.floor) || pickNumber(raw.floor),
    finishing: pickString(raw.finishing),
    view: pickString(raw.view),
    totalPrice: pickNumber(raw.totalPrice, raw.total_price),
    downPayment: pickNumber(raw.downPayment, raw.down_payment),
    overPrice: pickNumber(raw.overPrice, raw.over_price),
    remainingAmount: pickNumber(raw.remainingAmount, raw.remaining_amount),
    installmentYears: pickNumber(
      raw.installment_years,
      raw.installmentYears
    ),
    installmentAmountYearly: pickNumber(
      raw.installment_amount_yearly,
      raw.installmentAmountYearly
    ),
    deliveryDate: raw.deliveryDate || raw.delivery_date || null,
    deliveryYear: pickNumber(raw.deliveryYear, raw.delivery_year),
    isDelivered: pickBool(raw.is_delivered, raw.isDelivered),
    isPrimary: pickBool(raw.is_primary, raw.isPrimary),
    images: mapImages(
      Array.isArray(raw.images) && raw.images.length > 0
        ? raw.images
        : raw.image
          ? [raw.image]
          : []
    ),
    updatedAt: raw.updatedAt || raw.updated_at || null,
  };
}
