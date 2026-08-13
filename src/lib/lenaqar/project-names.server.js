import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";
import { SITE, lenaqarInventoryQuery } from "@/config/site";

const TTL_MS = 60 * 60 * 1000;
const BFF_SECRET = process.env.BFF_SECRET ?? "";

/** @type {{ data: object[]|null, fetchedAt: number, promise: Promise<object[]>|null }} */
const cache = {
  data: null,
  fetchedAt: 0,
  promise: null,
};

function toSlimProject(row) {
  if (!row || typeof row !== "object") return null;
  const enName = String(row.project || row.en_name || row.name || "").trim();
  if (!enName) return null;
  return {
    id: row.project_id || row.id || enName,
    en_name: enName,
    ar_name: String(row.project_ar || row.projectAr || row.ar_name || "").trim(),
    city: String(row.city || "").trim(),
    district: String(row.district || "").trim(),
    sub_district: String(row.sub_district || row.subDistrict || "").trim(),
  };
}

function uniqueProjects(rows) {
  const seen = new Set();
  const projects = [];
  for (const row of rows) {
    const project = toSlimProject(row);
    if (!project) continue;
    const key = project.en_name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    projects.push(project);
  }
  return projects;
}

async function fetchResaleUnitsPage(cursor) {
  const qs = new URLSearchParams();
  const query = {
    ...lenaqarInventoryQuery(),
    page_size: SITE.feed.pageSize,
    cursor,
  };
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "") continue;
    qs.set(key, String(value));
  }

  const headers = { accept: "application/json" };
  if (PUBLIC_X_API_KEY) headers["X-API-Key"] = PUBLIC_X_API_KEY;
  if (BFF_SECRET) headers["X-BFF-Secret"] = BFF_SECRET;

  const response = await fetch(`${API_BASE_URL}/public/v1/units?${qs}`, {
    headers,
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`PROJECT_NAMES_FETCH_FAILED_${response.status}`);
  }

  const json = await response.json();
  const units = json?.data?.units ?? json?.units ?? [];
  const pagination = json?.data?.pagination ?? json?.pagination ?? {};
  return {
    units: Array.isArray(units) ? units : [],
    pagination,
  };
}

async function fetchResaleProjectNames() {
  const collected = [];
  let cursor = null;

  for (let page = 0; page < SITE.feed.maxPages; page += 1) {
    const { units, pagination } = await fetchResaleUnitsPage(cursor);
    collected.push(...units);
    if (!pagination?.has_more_next || !pagination?.next_cursor) break;
    cursor = pagination.next_cursor;
  }

  return uniqueProjects(collected);
}

/**
 * Project names that actually have Homey resale sell units
 * (`is_primary=false`, `purpose=sell`, `client_id=homey`).
 */
export async function fetchLenaqarProjectNames() {
  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < TTL_MS) return cache.data;
  if (cache.promise) return cache.promise;

  cache.promise = (async () => {
    const list = await fetchResaleProjectNames();
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
