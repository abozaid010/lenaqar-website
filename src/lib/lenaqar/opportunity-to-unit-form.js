/**
 * Map a public opportunity/listing into add-unit-Modal `unitData`.
 * Omits identity fields (code, unitId) so submit creates a new unit.
 */

function pickText(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

function pickFormValue(value) {
  if (value == null || value === "") return "";
  return value;
}

function mapImages(images) {
  if (!Array.isArray(images)) return [];
  const out = [];
  for (const img of images) {
    const url = typeof img === "string" ? img.trim() : pickText(img?.url);
    if (url) out.push({ url });
  }
  return out;
}

export function opportunityToUnitFormPrefill(unit) {
  if (!unit || typeof unit !== "object") return null;

  return {
    purpose: "sell",
    unitTitle: pickText(unit.unitTitle),
    project: pickText(unit.project),
    project_ar: pickText(unit.projectAr),
    developer: pickText(unit.developer),
    city: pickText(unit.city),
    district: pickText(unit.district),
    sub_district: pickText(unit.subDistrict),
    buildingType: pickText(unit.buildingType) || "apartment",
    roomsCount: pickFormValue(unit.roomsCount),
    bathroomCount: pickFormValue(unit.bathroomCount),
    landArea: pickFormValue(unit.landArea),
    floor: pickFormValue(unit.floor),
    finishing: pickText(unit.finishing),
    view: pickText(unit.view),
    images: mapImages(unit.images),
    totalPrice: pickFormValue(unit.totalPrice),
    downPayment: pickFormValue(unit.downPayment),
    over_price: pickFormValue(unit.overPrice),
    remaining_amount: pickFormValue(unit.remainingAmount),
    installment_years: pickFormValue(unit.installmentYears),
    deliveryDate: unit.deliveryDate || "",
  };
}
