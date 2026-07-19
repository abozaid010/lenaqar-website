/**
 * Mirrors backend PublishingService._validate_publish rules that block publish.
 * Used for client preflight only; API 400 messages remain source of truth.
 */

export function hasGeneralMarketPrices(general) {
  if (!general || typeof general !== "object") return false;
  if (general.location_avg_price_per_sqm != null) return true;
  if (
    general.property_type_avg_price_per_sqm &&
    Object.keys(general.property_type_avg_price_per_sqm).length > 0
  ) {
    return true;
  }
  if (general.area_buckets) {
    return Object.values(general.area_buckets).some(
      (buckets) => Array.isArray(buckets) && buckets.length > 0
    );
  }
  return false;
}

/**
 * @returns {string[]} localized blocking issues
 */
export function getPublishBlockingIssues({ general, units, translate }) {
  const issues = [];
  const list = Array.isArray(units) ? units : [];

  if (list.length === 0) {
    issues.push(translate("marketIndex.publish.issues.needUnit"));
  }

  for (const unit of list) {
    if (!Array.isArray(unit?.evidence) || unit.evidence.length === 0) {
      issues.push(
        translate("marketIndex.publish.issues.unitNeedsEvidence").replace(
          "{id}",
          unit?.id || ""
        )
      );
    }
  }

  if (hasGeneralMarketPrices(general)) {
    if (!Array.isArray(general?.evidence) || general.evidence.length === 0) {
      issues.push(translate("marketIndex.publish.issues.generalNeedsEvidence"));
    }
  }

  return issues;
}

export function splitPublishErrorMessage(raw, separator) {
  return String(raw || "")
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean);
}
