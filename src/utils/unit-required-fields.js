/**
 * Required field rules for units (aligned with add-unit-Modal validation).
 * Used to highlight missing required fields on unit details when opened from pending approval.
 * @param {Object} unit - Unit object from API
 * @returns {string[]} List of field keys that are required but missing
 */
export function getMissingRequiredFields(unit) {
  if (!unit || typeof unit !== "object") return [];

  const missing = [];

  // Step 1 - Basic details
  const basicRequired = [
    "unitTitle",
    "project",
    "buildingType",
    "purpose",
    "city",
    "view",
    "district",
  ];
  for (const key of basicRequired) {
    const v = unit[key];
    if (v === undefined || v === null || String(v).trim() === "") {
      missing.push(key);
    }
  }

  const buildingType = (unit.buildingType || "").toString().toLowerCase();
  if (buildingType !== "office") {
    const roomsCount = unit.roomsCount;
    const bathroomCount = unit.bathroomCount;
    if (roomsCount === undefined || roomsCount === null || String(roomsCount).trim() === "") {
      missing.push("roomsCount");
    }
    if (bathroomCount === undefined || bathroomCount === null || String(bathroomCount).trim() === "") {
      missing.push("bathroomCount");
    }
  }

  // Step 2 - Purpose-specific
  const purpose = (unit.purpose || "").toString().toLowerCase();
  if (purpose === "sell") {
    const deliveryDate = unit.deliveryDate;
    if (!deliveryDate || String(deliveryDate).trim() === "") {
      missing.push("deliveryDate");
    }
    const totalPrice = unit.totalPrice;
    if (totalPrice === undefined || totalPrice === null || Number(totalPrice) <= 0) {
      missing.push("totalPrice");
    }
  } else if (purpose === "rent") {
    const rentDurationType = unit.rentDurationType || {};
    // Monthly only — daily/weekly do not satisfy required rent price.
    const monthlyPrice = Number(rentDurationType?.monthly?.price);
    if (!Number.isFinite(monthlyPrice) || monthlyPrice <= 0) {
      missing.push("rentDurationType");
    }
  }

  // Step 3 - Images (optional when dataSource === "ai_generated" and visibility === "pending_approval")
  const dataSource = unit.dataSource ?? unit.dataSource;
  const visibility = unit.visibility ?? unit.status;
  const isAiGeneratedPending =
    dataSource === "ai_generated" && visibility === "pending_approval";
  const images = unit.images;
  if (
    (!images || !Array.isArray(images) || images.length === 0) &&
    !isAiGeneratedPending
  ) {
    missing.push("images");
  }

  // Phone number (owner_mobile) is required
  const ownerMobile = unit.owner_mobile ?? unit.ownerMobile;
  if (ownerMobile === undefined || ownerMobile === null || String(ownerMobile).trim() === "") {
    missing.push("owner_mobile");
  }

  const finishing = unit.finishing;
  if (finishing === undefined || finishing === null || String(finishing).trim() === "") {
    missing.push("finishing");
  }
  // Furnishing required only for rent
  if (purpose === "rent") {
    const furnishing = unit.furnishing;
    if (furnishing === undefined || furnishing === null || String(furnishing).trim() === "") {
      missing.push("furnishing");
    }
  }
  if (purpose === "sell") {
    const developer = unit.developer;
    if (developer === undefined || developer === null || String(developer).trim() === "") {
      missing.push("developer");
    }
  }

  return missing;
}
