/**
 * Listing filters that arrive in the /opportunities URL but have no field in the
 * filter bar: property type, rooms and the price range. They come from a buy
 * request ("see units close to your request") or a shared link.
 *
 * The bar keeps them when the visitor presses Apply, so unless they are shown the
 * visitor cannot tell why changing the area or the cash still returns nothing.
 * `readRequestFilters` lists the ones that are really in effect so the bar can
 * show each as a removable chip; `queryWithoutFilters` builds the URL without them.
 */

/** Display order: what the unit is, then how big, then the price range. */
export const REQUEST_FILTER_KEYS = ["property_type", "bedrooms", "min_price", "max_price"];

const NUMERIC_KEYS = new Set(["bedrooms", "min_price", "max_price"]);

/**
 * @param {URLSearchParams} searchParams
 * @returns {{ key: string, value: string | number }[]} only filters the listing applies
 */
export function readRequestFilters(searchParams) {
  const filters = [];
  for (const key of REQUEST_FILTER_KEYS) {
    const raw = String(searchParams.get(key) || "").trim();
    if (!raw) continue;
    if (NUMERIC_KEYS.has(key)) {
      // Same rule as the listing's own parser: a positive number or nothing.
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) continue;
      filters.push({ key, value: n });
    } else {
      filters.push({ key, value: raw.toLowerCase() });
    }
  }
  return filters;
}

/**
 * @param {URLSearchParams} searchParams
 * @param {string[]} keys filters to drop
 * @returns {string} query string without them and without `page`
 */
export function queryWithoutFilters(searchParams, keys) {
  const params = new URLSearchParams(searchParams.toString());
  for (const key of keys) params.delete(key);
  // A different result set: the old page number may be past its end.
  params.delete("page");
  return params.toString();
}
