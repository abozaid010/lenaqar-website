/**
 * Browser Market Index API via BFF catch-all `/api/crm/market-index/*`.
 * Unwraps success envelopes; maps HTTP failures to Error with `.status`.
 */

function detailMessage(json, status) {
  const detail = json?.detail;
  const detailMsg =
    typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((d) => d?.msg || String(d)).join("; ")
        : null;
  return (
    json?.error_message || detailMsg || `Request failed (${status})`
  );
}

async function crm(path, options = {}, { retry429 = true, allow404Null = false } = {}) {
  const res = await fetch(`/api/crm/market-index${path}`, options);
  const json = await res.json().catch(() => null);

  if (res.status === 404 && allow404Null) {
    return null;
  }

  if (res.status === 429 && retry429) {
    await new Promise((r) => setTimeout(r, 1100));
    return crm(path, options, { retry429: false, allow404Null });
  }

  if (!res.ok || json?.status === false) {
    const msg = detailMessage(json, res.status);
    const err = new Error(typeof msg === "string" ? msg : "Request failed");
    err.status = res.status;
    err.error_message = json?.error_message || null;
    err.detail = json?.detail ?? null;
    throw err;
  }

  if (json && json.status === true) {
    return json.data;
  }
  return json?.data;
}

export async function fetchLocationRoots() {
  return crm("/locations/roots");
}

/** Flat leaf locations for single-field typeahead search. */
export async function fetchLocationLeaves({ limit } = {}) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  const qs = params.toString();
  return crm(`/locations/leaves${qs ? `?${qs}` : ""}`);
}

export async function fetchLocationChildren(locationId) {
  return crm(`/locations/${encodeURIComponent(locationId)}/children`);
}

export async function fetchLocationNode(locationId) {
  return crm(`/locations/${encodeURIComponent(locationId)}`);
}

/** Pending approval queue — admin/owner only. */
export async function fetchPendingLocations({ limit } = {}) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  const qs = params.toString();
  return crm(`/locations/pending${qs ? `?${qs}` : ""}`);
}

/**
 * Create city / district / sub_district.
 * @param {{
 *   level: "city"|"district"|"sub_district",
 *   en_name: string,
 *   ar_name?: string,
 *   aliases?: string[],
 *   parent_id?: string|null,
 *   slug_source?: string|null,
 *   force_pending?: boolean,
 * }} body
 */
export async function createLocation(body) {
  return crm("/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function approveLocation(locationId) {
  return crm(`/locations/${encodeURIComponent(locationId)}/approve`, {
    method: "POST",
  });
}

export async function rejectLocation(locationId) {
  return crm(`/locations/${encodeURIComponent(locationId)}/reject`, {
    method: "POST",
  });
}

/** Replaces the full aliases array. */
export async function updateLocationAliases(locationId, aliases) {
  return crm(`/locations/${encodeURIComponent(locationId)}/aliases`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aliases }),
  });
}

/**
 * Delete a location. Approved nodes require hard_delete_approved=true.
 * @param {string} locationId
 * @param {{ hardDeleteApproved?: boolean }} [opts]
 */
export async function deleteLocation(locationId, { hardDeleteApproved = false } = {}) {
  const params = new URLSearchParams();
  if (hardDeleteApproved) params.set("hard_delete_approved", "true");
  const qs = params.toString();
  return crm(
    `/locations/${encodeURIComponent(locationId)}${qs ? `?${qs}` : ""}`,
    { method: "DELETE" }
  );
}

/** Published card for a leaf; `null` when no published data (404). */
export async function fetchActiveCard(locationId) {
  return crm(`/cards/${encodeURIComponent(locationId)}/active`, undefined, {
    allow404Null: true,
  });
}

/**
 * @param {import('@/lib/market-index/evaluate.types').EstimateRequest} body
 */
export async function postEstimate(body) {
  return crm("/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function fetchCards({ status, limit } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (limit != null) params.set("limit", String(limit));
  const qs = params.toString();
  return crm(`/cards${qs ? `?${qs}` : ""}`);
}

export async function fetchCard(locationId) {
  return crm(`/cards/${encodeURIComponent(locationId)}`);
}

export async function saveCard(locationId, body) {
  return crm(`/cards/${encodeURIComponent(locationId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function saveUnit(locationId, unitBody) {
  return crm(`/cards/${encodeURIComponent(locationId)}/units`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(unitBody),
  });
}

export async function deleteUnit(locationId, unitId) {
  return crm(
    `/cards/${encodeURIComponent(locationId)}/units/${encodeURIComponent(unitId)}`,
    { method: "DELETE" }
  );
}

export async function publishCard(locationId) {
  return crm(`/cards/${encodeURIComponent(locationId)}/publish`, {
    method: "POST",
  });
}

export async function fetchHistory(locationId, { limit } = {}) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  const qs = params.toString();
  return crm(
    `/cards/${encodeURIComponent(locationId)}/history${qs ? `?${qs}` : ""}`
  );
}

export async function fetchVersion(locationId, version) {
  return crm(
    `/cards/${encodeURIComponent(locationId)}/versions/${encodeURIComponent(version)}`
  );
}
