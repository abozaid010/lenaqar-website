export const REQUIREMENT_SORTS = ["default", "newest", "highest_score"];

// Every public requirements feed shows the most recently updated requests.
export const PUBLIC_REQUIREMENT_SORT = "newest";

export function parseRequirementSort(value = PUBLIC_REQUIREMENT_SORT) {
  if (!REQUIREMENT_SORTS.includes(value)) {
    throw new RangeError("Invalid requirement sort");
  }
  return value;
}

export function publicRequirementsQuery({
  limit = 48,
  sort = PUBLIC_REQUIREMENT_SORT,
} = {}) {
  return new URLSearchParams({
    limit: String(Math.min(Math.max(Number(limit) || 48, 1), 100)),
    sort: parseRequirementSort(sort),
  });
}

// Homepage feed: 48 rows so the city chips have enough to filter client-side.
export const HOME_REQUIREMENT_LIMIT = 48;
