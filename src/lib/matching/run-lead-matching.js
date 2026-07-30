import { getClientRequirements, fetchUnitsFilter } from "@/utils/api";
import { requirementToUnitsFilter } from "@/lib/match/requirement-to-units-filter";
import { hasMatchablePricing } from "@/lib/matching/requirement-pricing";
import { MATCHING_STATUS } from "@/lib/matching/matching-statuses";
import {
  UnitRecommendationService,
  getMatchingUnitId,
} from "@/lib/matching/unit-recommendation-service";

/** Slim-list page size for matching (override only; no new filter fields). */
export const MATCHING_SLIM_PAGE_SIZE = 50;

/**
 * @param {object} lead
 * @returns {string | null}
 */
export function getLeadMatchId(lead) {
  if (!lead || typeof lead !== "object") return null;
  const id = lead.user_id ?? lead.userId ?? lead.id;
  if (id == null || id === "") return null;
  return String(id);
}

function isEmptyRequirement(requirement) {
  if (!requirement || typeof requirement !== "object") return true;
  if (requirement.error) return false; // handled separately
  const keys = Object.keys(requirement).filter(
    (k) => requirement[k] != null && requirement[k] !== "",
  );
  return keys.length === 0;
}

/**
 * Match a single lead: requirement → validate → slim-list → recommend.
 * @param {object} lead
 * @param {string | null} clientId
 * @returns {Promise<object>} LeadMatchResult
 */
export async function matchSingleLead(lead, clientId) {
  const leadId = getLeadMatchId(lead);
  const base = {
    leadId,
    lead,
    requirement: null,
    allUnits: [],
    recommendedUnitIds: [],
    dismissedUnitIds: [],
    status: MATCHING_STATUS.READY,
    errorMessage: null,
  };

  if (!leadId) {
    return {
      ...base,
      status: MATCHING_STATUS.MISSING_REQUIREMENT,
    };
  }

  let requirement;
  try {
    requirement = await getClientRequirements(leadId);
  } catch {
    return {
      ...base,
      status: MATCHING_STATUS.REQUIREMENT_ERROR,
      errorMessage: "matching.errors.requirementFetch",
    };
  }

  if (requirement?.error) {
    return {
      ...base,
      status: MATCHING_STATUS.REQUIREMENT_ERROR,
      errorMessage: "matching.errors.requirementFetch",
    };
  }

  if (isEmptyRequirement(requirement)) {
    return {
      ...base,
      status: MATCHING_STATUS.MISSING_REQUIREMENT,
    };
  }

  if (!hasMatchablePricing(requirement)) {
    return {
      ...base,
      requirement,
      status: MATCHING_STATUS.MISSING_PRICE,
    };
  }

  const filters = {
    ...requirementToUnitsFilter(requirement, clientId),
    page_size: MATCHING_SLIM_PAGE_SIZE,
  };

  let unitsResponse;
  try {
    unitsResponse = await fetchUnitsFilter(filters);
  } catch {
    return {
      ...base,
      requirement,
      status: MATCHING_STATUS.UNITS_ERROR,
      errorMessage: "matching.errors.unitsFetch",
    };
  }

  const allUnits = Array.isArray(unitsResponse?.data?.units)
    ? unitsResponse.data.units
    : [];

  if (allUnits.length === 0) {
    return {
      ...base,
      requirement,
      allUnits,
      status: MATCHING_STATUS.NO_MATCHING_UNITS,
    };
  }

  const recommended = UnitRecommendationService.select(allUnits, {
    dismissedIds: new Set(),
  });
  const recommendedUnitIds = recommended
    .map((u) => getMatchingUnitId(u))
    .filter(Boolean);

  return {
    ...base,
    requirement,
    allUnits,
    recommendedUnitIds,
    dismissedUnitIds: [],
    status:
      recommendedUnitIds.length > 0
        ? MATCHING_STATUS.READY
        : MATCHING_STATUS.NO_MATCHING_UNITS,
  };
}

/**
 * Sequentially match all leads; reports progress via onProgress.
 * @param {object[]} leads
 * @param {string | null} clientId
 * @param {{ onProgress?: (done: number, total: number, result: object) => void, signal?: { cancelled?: boolean } }} [opts]
 * @returns {Promise<object[]>}
 */
export async function runLeadMatching(leads, clientId, opts = {}) {
  const list = Array.isArray(leads) ? leads : [];
  const total = list.length;
  const results = [];

  for (let i = 0; i < list.length; i++) {
    if (opts.signal?.cancelled) break;
    const result = await matchSingleLead(list[i], clientId);
    results.push(result);
    opts.onProgress?.(i + 1, total, result);
  }

  return results;
}
