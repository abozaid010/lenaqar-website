import axiosInstance from "@/utils/axiosInstance";
import { tenantAuthConfig } from "./tenant-session.server";

const TTL_MS = 60 * 60 * 1000;

/** @type {{ data: object[]|null, fetchedAt: number, promise: Promise<object[]>|null }} */
const cache = {
  data: null,
  fetchedAt: 0,
  promise: null,
};

function toSlimProject(row) {
  if (!row || typeof row !== "object") return null;
  const enName = String(row.en_name || row.name || "").trim();
  if (!enName) return null;
  return {
    id: row.id || "",
    en_name: enName,
    ar_name: String(row.ar_name || "").trim(),
    city: String(row.city || "").trim(),
    district: String(row.district || "").trim(),
    sub_district: String(row.sub_district || "").trim(),
  };
}

async function fetchProjectNamesWithToken(accessToken) {
  const response = await axiosInstance.get(
    "/projects/v3/projects_names",
    tenantAuthConfig(accessToken),
  );
  const rows = response.data?.data ?? response.data;
  return Array.isArray(rows) ? rows.map(toSlimProject).filter(Boolean) : [];
}

async function fetchPublicProjectNames() {
  const response = await axiosInstance.get("/public/projects");
  const rows = response.data?.data ?? response.data;
  return Array.isArray(rows) ? rows.map(toSlimProject).filter(Boolean) : [];
}

/**
 * Lightweight project names for LenaQar location search.
 * Prefers the tenant names endpoint, then a caller session, then /public/projects.
 */
export async function fetchLenaqarProjectNames({ authToken } = {}) {
  if (authToken) {
    return fetchProjectNamesWithToken(authToken);
  }

  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < TTL_MS) return cache.data;
  if (cache.promise) return cache.promise;

  cache.promise = (async () => {
    let list = [];
    try {
      const { getLenaqarTenantSession } = await import(
        "./tenant-session.server"
      );
      const { accessToken } = await getLenaqarTenantSession();
      list = await fetchProjectNamesWithToken(accessToken);
    } catch {
      list = await fetchPublicProjectNames();
    }
    cache.data = list;
    cache.fetchedAt = Date.now();
    cache.promise = null;
    return list;
  })();

  try {
    return await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}
