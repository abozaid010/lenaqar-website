/**
 * Query params for GET /units/v1/slim-list on the Hidden Units page.
 * Always scopes by client_id (tenant workspace) and visibility (pending_approval | hidden).
 */

/**
 * @param {Record<string, unknown>} raw - Parsed search/filter payload
 * @param {string|null|undefined} clientId - Tenant workspace from CLIENT_ID cookie
 * @returns {Record<string, string | number>}
 */
export function buildPendingApprovalSlimListParams(raw, clientId) {
  const base = { ...(raw ?? {}) };
  delete base.client_id;
  delete base.clientId;

  const params = {
    page_size: Number(base.page_size) || 16,
    direction: base.direction || "forward",
  };

  if (base.cursor != null && base.cursor !== "") {
    params.cursor = base.cursor;
  }

  params.visibility =
    base.visibility != null && base.visibility !== ""
      ? base.visibility
      : "pending_approval";

  if (base.updated_at) {
    params.updated_at = base.updated_at;
  }
  if (base.property_type) {
    params.property_type = base.property_type;
  }
  if (base.min_price != null && base.min_price !== "") {
    params.min_price = base.min_price;
  }
  if (base.max_price != null && base.max_price !== "") {
    params.max_price = base.max_price;
  }
  if (base.min_area != null && base.min_area !== "") {
    params.min_area = base.min_area;
  }
  if (base.max_area != null && base.max_area !== "") {
    params.max_area = base.max_area;
  }

  const bedrooms =
    base.bedrooms != null && base.bedrooms !== "" && base.bedrooms !== "all"
      ? String(base.bedrooms).trim()
      : "";
  if (bedrooms !== "") {
    params.bedrooms = bedrooms;
  }

  const purpose =
    typeof base.purpose === "string" ? base.purpose.trim().toLowerCase() : "";
  if (purpose && purpose !== "all") {
    params.purpose = purpose;
  }

  const city =
    typeof base.city === "string" ? base.city.trim().toLowerCase() : "";
  if (city && city !== "all") {
    params.city = city;
  }
  const district =
    typeof base.district === "string"
      ? base.district.trim().toLowerCase()
      : "";
  if (district && district !== "all") {
    params.district = district;
  }
  const subDistrict =
    typeof base.sub_district === "string"
      ? base.sub_district.trim().toLowerCase()
      : "";
  if (subDistrict && subDistrict !== "all") {
    params.sub_district = subDistrict;
  }

  const author =
    typeof base.author === "string" ? base.author.trim() : base.author;
  if (author) {
    params.author = author;
  }

  if (clientId) {
    params.client_id = clientId;
  }

  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v === undefined || v === null || v === "") delete params[k];
  });

  return params;
}

/**
 * @param {Record<string, string | number>} params
 * @returns {string}
 */
export function buildPendingApprovalSlimListUrl(params) {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
  return `/units/v1/slim-list${qs ? `?${qs}` : ""}`;
}
