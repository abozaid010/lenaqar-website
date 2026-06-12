/**
 * Sort dashboard leads by score (0–100). Returns a new array; does not mutate input.
 * @param {Array<{ score?: number | string | null }>} users
 * @param {"asc" | "desc" | null | undefined} direction
 * @returns {Array}
 */
export function sortDashboardLeadsByScore(users, direction) {
  if (!Array.isArray(users) || users.length === 0) return users ?? [];
  if (direction !== "asc" && direction !== "desc") return users;

  return [...users].sort((a, b) => {
    const aScore = Number(a?.score) || 0;
    const bScore = Number(b?.score) || 0;
    return direction === "desc" ? bScore - aScore : aScore - bScore;
  });
}
