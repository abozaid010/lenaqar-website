/**
 * Browser Market Index API via BFF catch-all `/api/crm/market-index/*`.
 */

async function crm(path, options) {
  const res = await fetch(`/api/crm/market-index${path}`, options);
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.status === false) {
    const detail = json?.detail;
    const detailMsg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d?.msg || String(d)).join("; ")
          : null;
    const msg =
      json?.error_message || detailMsg || `Request failed (${res.status})`;
    const err = new Error(typeof msg === "string" ? msg : "Request failed");
    err.status = res.status;
    err.error_message = json?.error_message || null;
    throw err;
  }
  return json?.data;
}

export async function fetchLocationRoots() {
  return crm("/locations/roots");
}

export async function fetchLocationChildren(locationId) {
  return crm(`/locations/${encodeURIComponent(locationId)}/children`);
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
