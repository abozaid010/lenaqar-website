import { SITE } from "../../config/site.js";

/**
 * SITE name / country are LenaQar platform constants, not seller-supplied
 * facts — safe to fix here (never guessed on the seller's behalf).
 */
const PUBLIC_UNIT_CLIENT_NAME = "لينا عقار";
const PUBLIC_UNIT_COUNTRY = "Egypt";

/**
 * Build the SalePropertyDetails-shaped body from the public sell form.
 *
 * `clientId`/`dataSource` are included with placeholder-safe values because
 * they are required-present fields on the backend Pydantic model — the
 * backend overwrites both unconditionally after parsing
 * (src/api_routers/public_units_router.py), so these values are never
 * trusted, only present so validation succeeds.
 *
 * `visibility`, `author`, and `presentValue` are intentionally NOT sent —
 * the backend forces those too, and omitting them here means there is
 * nothing for a forged client to override even in principle.
 *
 * `paidAmount` maps to both `downPayment` (required by the schema; models
 * "cash paid today") and the optional `paid_amount` field — the seller only
 * answers this once.
 */
export function buildSaleUnitPayload({
  developer,
  buildingType,
  city,
  district,
  subDistrict,
  landArea,
  totalPrice,
  paidAmount,
  ownerName,
  ownerPhone,
}) {
  const paid = Number(paidAmount) || 0;
  return {
    clientId: SITE.clientId,
    dataSource: "website",
    clientName: PUBLIC_UNIT_CLIENT_NAME,
    country: PUBLIC_UNIT_COUNTRY,
    purpose: "sell",
    developer: String(developer || "").trim(),
    buildingType,
    city: city || undefined,
    district: district || undefined,
    sub_district: subDistrict || undefined,
    landArea: Number(landArea) || 0,
    totalPrice: Number(totalPrice) || 0,
    downPayment: paid,
    paid_amount: paid,
    images: [],
    owner_name: String(ownerName || "").trim() || undefined,
    owner_mobile: String(ownerPhone || "").trim() || undefined,
  };
}
