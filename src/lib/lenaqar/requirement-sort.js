export const REQUIREMENT_SORTS = ["default", "newest", "highest_score"];

export function parseRequirementSort(value = "default") {
  if (!REQUIREMENT_SORTS.includes(value)) {
    throw new RangeError("Invalid requirement sort");
  }
  return value;
}

export function publicRequirementsQuery({ limit = 48, sort = "default" } = {}) {
  return new URLSearchParams({
    limit: String(Math.min(Math.max(Number(limit) || 48, 1), 100)),
    sort: parseRequirementSort(sort),
  });
}
