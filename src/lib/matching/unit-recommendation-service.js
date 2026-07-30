export const MAX_RECOMMENDATIONS = 3;

/**
 * Stable id for a slim-list unit (prefer unitId, fall back to code).
 * @param {Record<string, unknown> | null | undefined} unit
 * @returns {string | null}
 */
export function getMatchingUnitId(unit) {
  if (!unit || typeof unit !== "object") return null;
  const rawId = unit.unitId ?? unit.unit_id ?? unit.id;
  if (rawId != null && String(rawId).trim()) return String(rawId).trim();
  if (unit.code != null && String(unit.code).trim()) {
    return String(unit.code).trim();
  }
  return null;
}

function toPositiveNumber(value) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function isRentPurpose(purpose) {
  const p = String(purpose || "").toLowerCase();
  return p === "rent" || p === "lease";
}

/** Display price used for "lowest total price" priority. */
function resolveDisplayPrice(unit) {
  if (!unit || typeof unit !== "object") return null;
  if (isRentPurpose(unit.purpose)) {
    return (
      toPositiveNumber(unit.monthlyRentPrice) ??
      toPositiveNumber(unit.totalPrice)
    );
  }
  return toPositiveNumber(unit.totalPrice);
}

function resolveDownPayment(unit) {
  return (
    toPositiveNumber(unit?.downPayment) ??
    toPositiveNumber(unit?.down_payment)
  );
}

function resolveArea(unit) {
  return (
    toPositiveNumber(unit?.landArea) ??
    toPositiveNumber(unit?.area)
  );
}

/**
 * Pick the best candidate by a numeric score.
 * @param {Array} candidates
 * @param {(unit: object) => number | null} scoreFn
 * @param {"min" | "max"} mode
 * @param {Set<string>} chosenIds
 * @returns {object | null}
 */
function pickByScore(candidates, scoreFn, mode, chosenIds) {
  let best = null;
  let bestScore = null;

  for (const unit of candidates) {
    const id = getMatchingUnitId(unit);
    if (!id || chosenIds.has(id)) continue;
    const score = scoreFn(unit);
    if (score == null) continue;
    if (
      best == null ||
      (mode === "min" && score < bestScore) ||
      (mode === "max" && score > bestScore)
    ) {
      best = unit;
      bestScore = score;
    }
  }

  return best;
}

/**
 * Recommendation logic isolated from UI.
 * Priority: lowest total/display price → lowest down payment → largest area.
 * Skips duplicates already selected; does not auto-replace dismissed units.
 */
export class UnitRecommendationService {
  /**
   * @param {Array} units - slim-list mapped units
   * @param {{ dismissedIds?: Set<string> | string[] }} [options]
   * @returns {Array} up to 3 unique units
   */
  static select(units, { dismissedIds = new Set() } = {}) {
    const list = Array.isArray(units) ? units : [];
    const dismissed =
      dismissedIds instanceof Set
        ? dismissedIds
        : new Set(Array.isArray(dismissedIds) ? dismissedIds : []);

    const candidates = list.filter((unit) => {
      const id = getMatchingUnitId(unit);
      return id != null && !dismissed.has(id);
    });

    if (candidates.length === 0) return [];

    const chosen = [];
    const chosenIds = new Set();

    const byPrice = pickByScore(
      candidates,
      (u) => resolveDisplayPrice(u),
      "min",
      chosenIds,
    );
    if (byPrice) {
      chosen.push(byPrice);
      chosenIds.add(getMatchingUnitId(byPrice));
    }

    if (chosen.length < MAX_RECOMMENDATIONS) {
      const byDown = pickByScore(
        candidates,
        (u) => resolveDownPayment(u),
        "min",
        chosenIds,
      );
      if (byDown) {
        chosen.push(byDown);
        chosenIds.add(getMatchingUnitId(byDown));
      }
    }

    if (chosen.length < MAX_RECOMMENDATIONS) {
      const byArea = pickByScore(
        candidates,
        (u) => resolveArea(u),
        "max",
        chosenIds,
      );
      if (byArea) {
        chosen.push(byArea);
        chosenIds.add(getMatchingUnitId(byArea));
      }
    }

    // Fill remaining slots when priority fields are missing on some units.
    for (const unit of candidates) {
      if (chosen.length >= MAX_RECOMMENDATIONS) break;
      const id = getMatchingUnitId(unit);
      if (!id || chosenIds.has(id)) continue;
      chosen.push(unit);
      chosenIds.add(id);
    }

    return chosen;
  }
}
