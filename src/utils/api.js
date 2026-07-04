"use client";

import { axiosInstance } from "@/lib/axiosInstance";
// PUBLIC_X_API_KEY removed — now added server-side by /api/crm/[...path]/route.js
import { safeMergeParams } from "./safeJsonParser";
import {
  mapSlimUnitsListResponse,
} from "@/lib/units/slim-unit-list-mapper";
import { parseExistingProjectData, parseValidationErrors } from "./error-parser";
import CityManager from "./city_manager";
import { CAMPAIGN_CHAT_CLIENT_ID, CAMPAIGN_CHAT_ENDPOINTS, CAMPAIGN_CHAT_PAGINATION } from "@/constants/campaign-chat";
import {
  normalizeCampaignPhoneParam,
  normalizeCampaignSessionData,
} from "@/utils/campaign-chat-session";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { withErrorHandling, createApiError, ERROR_TYPES } from "./api-error-handler";
import { validateClientId, createSafeClientId } from "./clientId-validator";
import { with2SecondRetry } from "./api-retry";
import { cleanRequirementsPayload } from "./cleanRequirements";
import { resolveWhatsappRecipientFields } from "@/lib/whatsapp-recipient";
import {
  resolveWhatsappMessageSource,
  WHATSAPP_RATE_LIMIT_EXCEEDED_CODE,
} from "@/constants/whatsapp-messaging";
import { normalizeLastAction } from "@/utils/actions";
import { toApiStartDate, toApiEndDate } from "@/utils/dashboardDate";

// Auth API
export async function loginUser(credentials) {
  const isDev = process.env.NODE_ENV === "development";
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('username', credentials.email);
  params.append('password', credentials.password);

  const startedAt = Date.now();
  if (isDev) {
    console.log("[auth][login][request]", {
      method: "POST",
      url: `${axiosInstance.defaults.baseURL || ""}/client/login`,
      username: credentials?.email ? String(credentials.email) : null,
      contentType: "application/x-www-form-urlencoded",
    });
  }

  const response = await axiosInstance.post("client/login", params, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    validateStatus: status => status >= 200 && status < 500
  });

  if (!response.data) {
    throw new Error("No data received from server");
  }

  if (isDev) {
    const ms = Date.now() - startedAt;
    const body = response?.data;
    const data = body?.data;
    const dataKeys =
      data && typeof data === "object" && !Array.isArray(data)
        ? Object.keys(data).filter((k) => !String(k).includes("token"))
        : null;
    console.log("[auth][login][response]", {
      method: "POST",
      url: `${axiosInstance.defaults.baseURL || ""}/client/login`,
      status: response?.status ?? null,
      durationMs: ms,
      ok: Boolean(body?.status),
      message: body?.message ?? null,
      dataKeys,
    });
  }

  return response.data;
}

/**
 * @param {string|object} searchParams - Query filters (JSON string or object)
 * @param {{ cursor?: string | null }} [pageParam] - Cursor pagination: pass { cursor } from infinite query
 */
export async function fetchUsersData(searchParams, pageParam = {}) {
  try {
    const merged =
      typeof searchParams === "string"
        ? safeMergeParams(searchParams, { limit: 100 })
        : { limit: 100, ...(searchParams || {}) };
    const { action, clientId, tab, userId, cursor, direction, ...restMerged } =
      merged;
    const params = {
      ...restMerged,
      limit: merged.limit ?? 100,
      ...(action && action !== "all" ? { action } : {}),
      ...(pageParam?.cursor
        ? { cursor: pageParam.cursor, direction: pageParam.direction ?? "forward" }
        : {}),
    };

    const response = await axiosInstance.get(`messages/v2/all`, {
      params,
    });

    // Validate response data structure
    if (!response.data || !response.data.data) {
      throw new Error("Invalid response format from server");
    }

    // Validate that users is an array
    if (!response.data.data.users || !Array.isArray(response.data.data.users)) {
      throw new Error("Expected users array but received invalid data format");
    }

    return {
      ...response.data.data,
      users: response.data.data.users.map((user) => ({
        ...user,
        last_action: normalizeLastAction(user.last_action),
      })),
    };
  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    // Re-throw the error so TanStack Query can handle it properly
    throw error;
  }
}

/**
 * @typedef {Object} FetchUnitsFilterOptions
 * @property {boolean} [usePublicEndpoint=false] - When true, calls `/public/v1/slim-list`; otherwise `/units/v1/slim-list`.
 */

/**
 * Fetches a paginated, filtered units list (slim payload for grid cards).
 * All filters (visibility, city, purpose, etc.) belong in searchParams / query payload.
 * Full unit documents remain on `/units/all` and detail endpoints.
 */
const fetchUnitsFilterBase = async (searchParams, { usePublicEndpoint = false } = {}) => {
  try {
    const params = safeMergeParams(searchParams, { page_size: 16 });
    const url = usePublicEndpoint ? "/public/v1/slim-list" : "/units/v1/slim-list";
    const qs = new URLSearchParams(params).toString();

    const response = await axiosInstance.get(qs ? `${url}?${qs}` : url);

    // Validate response data structure
    if (!response.data || !response.data.data) {
      throw new Error("Invalid response format from server");
    }

    // Validate that units is an array
    if (!response.data.data.units || !Array.isArray(response.data.data.units)) {
      throw new Error("Expected units array but received invalid data format");
    }

    // Validate pagination exists (optional but good to check)
    if (response.data.data.pagination === undefined) {
      console.warn("Pagination data missing in response");
    }

    return mapSlimUnitsListResponse(response.data);
  } catch (error) {
    console.error("Failed to fetch units:", error.message);
    // Re-throw the error so TanStack Query can handle it properly
    throw error;
  }
};

export const fetchUnitsFilter = with2SecondRetry(fetchUnitsFilterBase);

/**
 * Fetches units from /units/all for the Hidden Units page.
 * Sends client_id from the CLIENT_ID cookie (active tenant workspace, e.g. homey)
 * and visibility ("pending_approval" by default, or "hidden" when selected).
 * Does not send is_primary — pending/hidden units may be primary or resale.
 */
export async function fetchPendingApprovalUnits(searchParams = {}) {
  try {
    const parsed =
      typeof searchParams === "string"
        ? (() => {
            try {
              return JSON.parse(searchParams);
            } catch {
              return {};
            }
          })()
        : { ...(searchParams || {}) };

    const params = {
      page_size: Number(parsed.page_size) || 16,
      direction: parsed.direction || "forward",
      ...(parsed.cursor != null && parsed.cursor !== ""
        ? { cursor: parsed.cursor }
        : {}),
    };

    params.visibility =
      parsed.visibility != null && parsed.visibility !== ""
        ? parsed.visibility
        : "pending_approval";

    // Filter by updated_at (ISO 8601, e.g. '2024-01-01T00:00:00Z')
    if (parsed.updated_at) {
      params.updated_at = parsed.updated_at;
    }

    if (parsed.property_type) {
      params.property_type = parsed.property_type;
    }
    if (parsed.min_price != null && parsed.min_price !== "") {
      params.min_price = parsed.min_price;
    }
    if (parsed.max_price != null && parsed.max_price !== "") {
      params.max_price = parsed.max_price;
    }

    // Tenant scope: cookie CLIENT_ID (e.g. homey), not JWT client_id (often "public").
    const clientId = createSafeClientId(LenaCookiesManager.getClientId());
    if (clientId) {
      params.client_id = clientId;
    }

    const response = await axiosInstance.get("/units/all", { params });

    if (!response.data || !response.data.data) {
      return {
        status: true,
        code: 200,
        data: {
          units: [],
          count: 0,
          pagination: {
            next_cursor: null,
            prev_cursor: null,
            has_more_next: false,
            has_more_prev: false,
          },
        },
      };
    }

    const data = response.data.data;
    const units = Array.isArray(data.units) ? data.units : [];
    const pagination = data.pagination || {
      next_cursor: null,
      prev_cursor: null,
      has_more_next: false,
      has_more_prev: false,
    };

    return {
      ...response.data,
      data: {
        units,
        count: data.count ?? units.length,
        pagination,
      },
    };
  } catch (error) {
    console.error("Failed to fetch pending approval units:", error.message);
    throw error;
  }
}

// Original fetchDevelopers - keeps full developer data for developers tab with pagination
const fetchDevelopersBase = async ({ pageParam, pageSize = 20 } = {}) => {
  const params = new URLSearchParams();
  params.append("page_size", String(pageSize));
  
  // Add cursor if provided (for infinite scroll)
  if (pageParam) {
    params.append("cursor", pageParam);
  }

  const url = `/developers/v1/get_all_slim?${params.toString()}`;
  const response = await axiosInstance.get(url);
  
  // Validate response data structure according to API specification
  if (!response.data) {
    throw new Error("Invalid response format from server: missing response.data");
  }

  // Handle the exact response structure from API specification
  if (!response.data.status || !response.data.data) {
    throw new Error(
      `Invalid response structure. Expected {status: true, data: {developers: [], next_cursor: string|null}}, but got: ${JSON.stringify(Object.keys(response.data || {}))}`
    );
  }

  const { developers, next_cursor } = response.data.data;
  
  // Validate developers array
  if (!Array.isArray(developers)) {
    throw new Error(`Expected developers to be an array, got: ${typeof developers}`);
  }
  
  // Sort developersData by name according to app language: ar_name if Arabic, else en_name
  const lang = typeof window !== "undefined" && window.localStorage
    ? window.localStorage.getItem("lang")
    : "en";
  const sortedDevelopers = [...developers].sort((a, b) => {
    const nameA = (lang === "ar" ? a.ar_name : a.en_name) || "";
    const nameB = (lang === "ar" ? b.ar_name : b.en_name) || "";
    return nameA.localeCompare(nameB, lang === "ar" ? "ar" : "en", { sensitivity: "base" });
  });
  
  return {
    developers: sortedDevelopers,
    nextCursor: next_cursor,
    hasNext: next_cursor !== null
  };
};

export const fetchDevelopers = with2SecondRetry(fetchDevelopersBase);

function normalizeDeveloperNameRow(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id ?? raw.uuid ?? raw.developer_id ?? "";
  const en_name =
    raw.en_name ?? raw.enName ?? raw.name_en ?? raw.english_name ?? "";
  const ar_name =
    raw.ar_name ?? raw.arName ?? raw.name_ar ?? "";
  const developer_name =
    raw.developer_name ??
    raw.developerName ??
    (en_name || ar_name || "");
  const name = raw.name ?? developer_name ?? en_name ?? ar_name ?? "";
  const idStr = id !== undefined && id !== null ? String(id).trim() : "";
  if (!idStr && !en_name && !ar_name) return null;
  return {
    ...raw,
    id: idStr || raw.id,
    developer_id: raw.developer_id ?? (idStr || raw.id),
    en_name,
    ar_name,
    developer_name,
    name,
  };
}

/**
 * Parse body from `get_all_names`-style endpoints.
 * Returns `null` if the shape is unknown (caller may try another URL or fallback).
 */
function extractDeveloperNameRowsFromBody(body) {
  if (body == null) return null;
  if (Array.isArray(body)) return body;
  if (typeof body !== "object") return null;
  if (body.status === false) return null;

  if (Array.isArray(body.data)) return body.data;
  if (body.data && typeof body.data === "object") {
    if (Array.isArray(body.data.developers)) return body.data.developers;
    if (Array.isArray(body.data.names)) return body.data.names;
    if (Array.isArray(body.data.items)) return body.data.items;
  }
  if (Array.isArray(body.developers)) return body.developers;
  if (Array.isArray(body.names)) return body.names;
  return null;
}

function sortDeveloperNameRows(normalized) {
  const lang =
    typeof window !== "undefined" && window.localStorage
      ? window.localStorage.getItem("lang")
      : "en";
  return [...normalized].sort((a, b) => {
    const nameA = (lang === "ar" ? a.ar_name : a.en_name) || a.name || "";
    const nameB = (lang === "ar" ? b.ar_name : b.en_name) || b.name || "";
    return nameA.localeCompare(nameB, lang === "ar" ? "ar" : "en", {
      sensitivity: "base",
    });
  });
}

async function fetchDeveloperNamesFromSlimFallback() {
  const response = await axiosInstance.get(
    "/developers/v1/get_all_slim?page_size=50",
    {
      headers: { accept: "application/json" },
      timeout: 45000,
    }
  );

  if (!response.data?.status || !response.data?.data) {
    throw new Error("Invalid slim response for developer names");
  }

  const { developers } = response.data.data;
  if (!Array.isArray(developers)) {
    throw new Error("Slim response missing developers array");
  }

  const normalized = developers.map(normalizeDeveloperNameRow).filter(Boolean);
  return sortDeveloperNameRows(normalized);
}

/** Authenticated-only (Bearer via `axiosInstance`); not a public API. */
const DEVELOPER_GET_ALL_NAMES_URLS = ["/developers/v1/get_all_names"];

/**
 * Autocomplete developer list: `GET /developers/v1/get_all_names` (auth required),
 * then falls back to slim list if the response is missing or unrecognized.
 */
export async function fetchDeveloperNames() {
  for (const url of DEVELOPER_GET_ALL_NAMES_URLS) {
    try {
      const response = await axiosInstance.get(url, {
        headers: { accept: "application/json" },
        timeout: 25000,
        validateStatus: () => true,
      });

      if (response.status !== 200 || !response.data) {
        continue;
      }

      const rows = extractDeveloperNameRowsFromBody(response.data);
      if (rows !== null) {
        const normalized = rows.map(normalizeDeveloperNameRow).filter(Boolean);
        return sortDeveloperNameRows(normalized);
      }
    } catch {
      /* try next */
    }
  }

  return fetchDeveloperNamesFromSlimFallback();
}

function normalizeDeveloperDetailPayload(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const description =
    raw.description ?? raw.en_description ?? raw.enDescription ?? "";
  const ar_description =
    raw.ar_description ?? raw.ar_desc ?? raw.arDescription ?? "";
  const en_name = raw.en_name ?? raw.english_name ?? raw.name_en ?? "";
  const ar_name = raw.ar_name ?? raw.name_ar ?? "";
  const id = raw.id ?? raw.uuid ?? raw.developer_id ?? null;
  return {
    ...raw,
    id,
    description,
    ar_description,
    en_name,
    ar_name,
    updated_at: raw.updated_at ?? raw.updatedAt ?? raw.modified_at ?? null,
    client_id: raw.client_id ?? raw.clientId ?? null,
    author: raw.author ?? raw.created_by ?? null,
    sales_email: raw.sales_email ?? raw.email ?? null,
    sales_phone: raw.sales_phone ?? raw.phone ?? null,
  };
}

function isLikelyDeveloperRecord(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  return Boolean(
    obj.id ||
      obj.uuid ||
      obj.developer_id ||
      obj.en_name ||
      obj.ar_name ||
      obj.description ||
      obj.ar_description ||
      obj.en_description ||
      obj.sales_email
  );
}

// Fetch individual developer details by ID
const fetchDeveloperDetailsBase = async (developerId) => {
  if (!developerId) {
    throw new Error("Developer ID is required");
  }
  try {
    const response = await axiosInstance.get(`/developers/${developerId}`, {
      headers: { accept: "application/json" },
    });

    if (!response.data) {
      throw new Error("Invalid response format from server: missing response.data");
    }

    const envelope = response.data;

    if (envelope.status === false) {
      throw new Error(
        envelope.error_message || envelope.message || "Failed to load developer details"
      );
    }

    let payload =
      envelope.data !== undefined && envelope.data !== null ? envelope.data : envelope;

    if (payload && typeof payload === "object" && payload.developer) {
      payload = payload.developer;
    }

    if (
      payload &&
      typeof payload === "object" &&
      !isLikelyDeveloperRecord(payload) &&
      payload.data &&
      typeof payload.data === "object" &&
      isLikelyDeveloperRecord(payload.data)
    ) {
      payload = payload.data;
    }

    if (!isLikelyDeveloperRecord(payload) && isLikelyDeveloperRecord(envelope)) {
      payload = envelope;
    }

    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid developer details payload");
    }

    const normalized = normalizeDeveloperDetailPayload(payload);

    if (!normalized.id) {
      throw new Error(
        `Developer details response missing id. Keys: ${JSON.stringify(Object.keys(payload))}`
      );
    }

    return normalized;
  } catch (error) {
    console.error("Failed to fetch developer details:", error?.message || error);
    throw error;
  }
};

export const fetchDeveloperDetails = with2SecondRetry(fetchDeveloperDetailsBase);

/**
 * Fetches a single project by ID (full details).
 * Response: { status, code, message, data: project, error_message }
 */
export async function fetchProjectById(projectId, isPublic = false) {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  const path = isPublic ? `/public/projects/id/${projectId}` : `/projects/id/${projectId}`;
  try {
    const response = await axiosInstance.get(path);
    if (!response.data) {
      throw new Error("Invalid response format from server: missing response.data");
    }
    if (response.data.data) {
      return response.data;
    }
    throw new Error(
      `Unexpected response structure. Expected { data: project }, got: ${JSON.stringify(Object.keys(response.data || {}))}`
    );
  } catch (error) {
    console.error("Failed to fetch project by id:", error.message);
    throw error;
  }
}

/** Fetches all projects in one request (no pagination). For paginated list use fetchProjectsPaginated. */
export async function fetchProjects(isPublic = false) {
  const url = isPublic ? "/public/projects" : "/projects/all";

  try {
    const response = await axiosInstance.get(url);

    // Validate response data structure
    if (!response.data) {
      throw new Error("Invalid response format from server: missing response.data");
    }

    // Check if data is directly an array (response.data is array)
    if (Array.isArray(response.data)) {
      return response.data;
    }

    // Check if data is nested (response.data.data is array)
    if (response.data.data) {
      if (!Array.isArray(response.data.data)) {
        throw new Error(
          `Expected array but received: ${typeof response.data.data}. Response structure: ${JSON.stringify(Object.keys(response.data))}`
        );
      }
      return response.data.data;
    }

    // If neither structure matches, throw error
    throw new Error(
      `Unexpected response structure. Expected array or {data: array}, but got: ${JSON.stringify(Object.keys(response.data || {}))}`
    );
  } catch (error) {
    console.error("Failed to fetch projects:", error.message);
    // Re-throw the error so TanStack Query can handle it properly
    throw error;
  }
}

/**
 * Fetches lightweight project names for dropdowns/filters.
 * Response items: { id, en_name, ar_name, city, district } (district required for city+district filtering).
 */
const fetchProjectsNamesBase = async (isPublic = false) => {
  const url = isPublic ? "/projectsv2/all_projects_names?public=true" : "/projectsv2/all_projects_names";

  const response = await axiosInstance.get(url);

  // Validate response data structure
  if (!response.data) {
    throw new Error("Invalid response format from server: missing response.data");
  }

  // Handle new API response structure: {status, code, message, data, error_message}
  if (response.data.data) {
    if (!Array.isArray(response.data.data)) {
      throw new Error(
        `Expected array but received: ${typeof response.data.data}. Response structure: ${JSON.stringify(Object.keys(response.data))}`
      );
    }
    return response.data.data;
  }

  // Fallback: check if data is directly an array (for backward compatibility)
  if (Array.isArray(response.data)) {
    return response.data;
  }

  // If neither structure matches, throw error
  throw new Error(
    `Unexpected response structure. Expected {data: array} or array, but got: ${JSON.stringify(Object.keys(response.data || {}))}`
  );
};

export const fetchProjectsNames = with2SecondRetry(fetchProjectsNamesBase);

export async function fetchProjectsPaginated({ limit = 10, lastDocId, cityEnName, developerId } = {}) {
  try {
    const params = new URLSearchParams();
    params.append("limit", String(limit));
    if (lastDocId) params.append("last_doc_id", lastDocId);
    if (cityEnName) params.append("city_en_name", cityEnName);
    if (developerId) params.append("developer_id", developerId);

    const response = await axiosInstance.get(`/projectsv2/all?${params.toString()}`);

    if (!response.data) {
      throw new Error("Invalid response format from server: missing response.data");
    }

    // Support both response.data.data and response.data (payload at top level)
    const data = response.data.data ?? response.data;
    if (!data || !Array.isArray(data.projects)) {
      throw new Error(
        `Unexpected response structure. Expected { projects: array, last_doc_id?, has_more? }, but got: ${JSON.stringify(Object.keys(data || {}))}`
      );
    }

    return data; // { projects, last_doc_id, has_more }
  } catch (error) {
    console.error("Failed to fetch paginated projects:", error.message);
    throw error;
  }
}

export async function fetchCitisAndProjects() {
  try {
    // Get singleton instance and return cities and districts data
    // Data is loaded once at website lifetime and cached in memory
    const cityManager = CityManager.getInstance();
    return cityManager.getCitiesAndDistrictsData();
  } catch (error) {
    console.error("Failed to fetch cities and districts:", error.message);
    // Re-throw the error so TanStack Query can handle it properly
    throw error;
  }
}

// Campaigns API //
export async function fetchCampaigns({ limit = 50, offset = 0 } = {}) {
  try {
    const response = await axiosInstance.get("/campaign/list", {
      params: { limit, offset },
    });

    if (!response.data || !response.data.data) {
      throw new Error("Invalid response format from server");
    }

    const campaigns = response.data.data.campaigns;
    if (!Array.isArray(campaigns)) {
      throw new Error("Expected campaigns array but received invalid data format");
    }

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch campaigns:", error.message);
    throw error;
  }
}

/**
 * Lightweight campaign id list for filters (GET /campaign/names_only).
 * @returns {Promise<string[]>}
 */
export async function fetchCampaignNamesOnly({ limit = 50, offset = 0 } = {}) {
  const response = await axiosInstance.get("/campaign/names_only", {
    params: { limit, offset },
  });

  if (!response.data?.data || !Array.isArray(response.data.data.campaign_ids)) {
    throw new Error("Invalid response format from campaign names_only");
  }

  return response.data.data.campaign_ids;
}

export async function createCampaign(payload) {
  try {
    const response = await axiosInstance.post("/campaign/create", payload);
    return response.data;
  } catch (error) {
    console.error("Failed to create campaign:", error.message);
    return { error: error.response?.data?.error_message || error.message };
  }
}

export async function updateCampaign(id, payload) {
  try {
    const body = { ...payload, campaign_id: id };
    const response = await axiosInstance.patch(
      `/campaign/update?campaign_id=${id}`,
      body
    );
    return response.data;
  } catch (error) {
    console.error("Failed to update campaign:", error.message);
    return { error: error.response?.data?.error_message || error.message };
  }
}

export async function getClientActions(phoneNumber) {
  try {
    const response = await axiosInstance.get(`action/${phoneNumber}`);

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
    return { error: error.message };
  }
}

/**
 * Fetch scheduled actions by date range.
 * Sends allowed actions under the `action` query param as requested by backend.
 */
export async function fetchScheduledActionsByDate(
  startDate,
  endDate,
  actions = []
) {
  try {
    const params = new URLSearchParams();
    params.set("start_date", startDate);
    params.set("end_date", endDate);
    actions.forEach((action) => {
      params.append("action", action);
    });
    const response = await axiosInstance.get(
      `action/scheduled-actions-by-date?${params.toString()}`
    );

    const list = response?.data?.data?.actions;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Failed to fetch scheduled actions by date:", error.message);
    return [];
  }
}

// Tags API helpers
export async function addLeadTags(userId, tags) {
  try {
    // Normalize tags before sending
    const normalizedTags = Array.isArray(tags) 
      ? tags.map(tag => String(tag).trim()).filter(Boolean)
      : [String(tags).trim()].filter(Boolean);
    
    if (normalizedTags.length === 0) {
      return { error: "No valid tags provided" };
    }

    const response = await axiosInstance.post(`/messages/dashboard/${userId}/tags/add`, {
      tags: normalizedTags,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to add tags:", error.message);
    return { error: error.response?.data?.error_message || error.message };
  }
}

export async function removeLeadTags(userId, tags) {
  try {
    // Normalize tags before sending
    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [String(tags).trim()].filter(Boolean);

    if (normalizedTags.length === 0) {
      return { error: "No valid tags provided" };
    }

    // DELETE /messages/dashboard/{dashboard_id}/tags
    // Body: { "tags": ["tag1_to_remove"] }
    const response = await axiosInstance.delete(
      `/messages/dashboard/${userId}/tags`,
      { data: { tags: normalizedTags } },
    );
    return response.data;
  } catch (error) {
    console.error("Failed to remove tags:", error.message);
    return { error: error.response?.data?.error_message || error.message };
  }
}

export async function replaceLeadTags(userId, tags) {
  try {
    // Normalize tags before sending
    const normalizedTags = Array.isArray(tags) 
      ? tags.map(tag => String(tag).trim()).filter(Boolean)
      : [String(tags).trim()].filter(Boolean);
    
    const response = await axiosInstance.put(`/messages/dashboard/${userId}/tags`, {
      tags: normalizedTags,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to replace tags:", error.message);
    return { error: error.response?.data?.error_message || error.message };
  }
}

export async function fetchUnitById(id, isPublic = false) {
  const url = isPublic ? `/public/unit-details/${id}` : `/units/details/${id}`;
  try {
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch unit by id:", error.message);
    return { error: error.message };
  }
}

export async function fetchUnitByCode(code, isPublic = false) {
  const trimmed = String(code ?? "").trim();
  if (!trimmed) return { error: "Invalid unit code" };

  const url = isPublic
    ? `/public/unit-by-code/${encodeURIComponent(trimmed)}`
    : `/units/by-code/${encodeURIComponent(trimmed)}`;
  try {
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch unit by code:", error.message);
    return { error: error.message };
  }
}

export const addUnit = withErrorHandling(async (unitData) => {
  const response = await axiosInstance.post(`/units/v1/add-sale`, unitData);
  return response.data;
});

export const addUnitRent = withErrorHandling(async (unitData) => {
  const response = await axiosInstance.post(`/units/v1/add-rent`, unitData);
  return response.data;
});

export const addUnitSaleViaExcel = withErrorHandling(async (formData) => {
  // v2: import units by developer and return extended summary,
  // including projects_not_updated for optional cleanup.
  const response = await axiosInstance.post(
    `/units/v2/import_units_by_developer`,
    formData,
    {
      timeout: 300000, // 5 minutes
    }
  );
  return response.data;
});

/**
 * Delete only primary units (isPrimary=true) for the given project IDs.
 * Used as a cleanup step after importing developer units when some
 * projects were not updated.
 */
export const deletePrimaryUnits = withErrorHandling(async (projectIds) => {
  const response = await axiosInstance.delete(
    `/units/v2/delete_primary_units`,
    {
      data: {
        project_ids: projectIds,
      },
    }
  );
  return response.data;
});

export const extractUnitsFromText = withErrorHandling(async (text) => {
  const response = await axiosInstance.post(`/units/extract-from-text`, {
    text: text || "",
  });
  return response.data;
});

export const deleteUnit = withErrorHandling(async (id) => {
  const response = await axiosInstance.delete(`/units/delete?unit_id=${id}`);
  return response.data;
});

export const updateUnit = withErrorHandling(async (unit) => {
  const response = await axiosInstance.post(`/units/v1/update-sale`, unit);
  return response.data;
});

export const updateUnitRent = withErrorHandling(async (unit) => {
  const response = await axiosInstance.post(`/units/v1/update-rent`, unit);
  return response.data;
});

export const approveUnitVisibility = withErrorHandling(async (unit) => {
  const purpose = String(unit?.purpose || "sell").toLowerCase();
  const endpoint =
    purpose === "rent" ? `/units/v1/update-rent` : `/units/v1/update-sale`;
  const response = await axiosInstance.post(endpoint, {
    ...unit,
    unitId: unit?.unitId,
    purpose: purpose === "rent" ? "rent" : "sell",
    visibility: "visible",
  });
  return response.data;
});

export async function getClientRequirements(user_id) {
  try {
    const response = await axiosInstance.get(`requirements/${user_id}`);

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
    return { error: error.message };
  }
}

// Projects CRUD operations //
export async function getprojects(city, district) {
  try {
    const response = await axiosInstance.get(
      `/projects/get/${city}/${district}`
    );

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
    return { error: error.message };
  }
}
export async function addCompound(compoundData) {
  try {
    const response = await axiosInstance.post(
      `/projects/create`,
      compoundData
    );
    return response.data;
  } catch (error) {
    const statusCode = error.response?.status;
    const errorMessage = error.response?.data?.error_message || error.message;

    console.log("[addCompound] Error caught:", {
      statusCode,
      errorMessage: errorMessage?.substring(0, 200),
      fullErrorResponse: error.response?.data,
    });

    // Check for 400 status code and try to extract existing_project_data
    if (statusCode === 400 && errorMessage) {
      const existingProjectData = parseExistingProjectData(errorMessage);
      console.log("[addCompound] Parsed existing_project_data:", {
        found: !!existingProjectData,
        keys: existingProjectData ? Object.keys(existingProjectData) : null,
      });
      if (existingProjectData) {
        return {
          error: errorMessage,
          existing_project_data: existingProjectData,
          statusCode: 400,
        };
      }

      // Check for validation errors
      const validationErrors = parseValidationErrors(errorMessage);
      if (Object.keys(validationErrors).length > 0) {
        console.log("[addCompound] Parsed validation errors:", validationErrors);
        return {
          error: errorMessage,
          validation_errors: validationErrors,
          statusCode: 400,
        };
      }
    }

    return { error: errorMessage };
  }
}
export async function updatecompound(compoundData, projectId) {
  try {
    console.log("[updatecompound] Starting update request:", {
      projectId,
      compoundData: {
        ...compoundData,
        images: compoundData.images?.length || 0,
        payment_plans: compoundData.payment_plans?.length || 0,
        properties_types: compoundData.properties_types?.length || 0,
      },
    });

    const response = await axiosInstance.patch(
      `/projects/${projectId}/update-fields`,
      compoundData
    );

    console.log("[updatecompound] API Response:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
    });

    return response.data;
  } catch (error) {
    console.error("[updatecompound] Error occurred:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      fullError: error,
    });

    const statusCode = error.response?.status;
    const errorMessage = error.response?.data?.error_message || error.message;

    // Check for 400 status code and try to extract existing_project_data
    if (statusCode === 400 && errorMessage) {
      const existingProjectData = parseExistingProjectData(errorMessage);
      if (existingProjectData) {
        return {
          error: errorMessage,
          existing_project_data: existingProjectData,
          statusCode: 400,
        };
      }

      // Check for validation errors
      const validationErrors = parseValidationErrors(errorMessage);
      if (Object.keys(validationErrors).length > 0) {
        console.log("[updatecompound] Parsed validation errors:", validationErrors);
        return {
          error: errorMessage,
          validation_errors: validationErrors,
          statusCode: 400,
        };
      }
    }

    return { error: errorMessage };
  }
}
export async function deleteProject(project_id) {
  try {
    const response = await axiosInstance.delete(
      `/projects/delete/${project_id}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to add compound:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}

// Phases CRUD operations //
export async function deletePhase(idProject, idPhase) {
  try {
    const response = await axiosInstance.delete(
      `/project-phases/${idProject}/phase-delete/${idPhase}`
    );

    return response.data;
  } catch (error) {
    console.error("Failed to add unit:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}
export async function addNewPhase(phaseData, idProject) {
  try {
    const response = await axiosInstance.post(
      `project-phases/${idProject}/phase-create`,
      phaseData
    );

    return response.data;
  } catch (error) {
    console.error("Failed to add unit:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}
export async function updatePhase(phaseData, idProject, idPhase) {
  try {
    const response = await axiosInstance.put(
      `/project-phases/${idProject}/phase-update/${idPhase}`,
      phaseData
    );

    return response.data;
  } catch (error) {
    console.error("Failed to add unit:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}

// Developers CRUD operations //
export async function addDeveloper(developerData) {
  try {
    const response = await axiosInstance.post(
      `/developers/create`,
      developerData
    );
    return response.data;
  } catch (error) {
    console.error("Failed to add developer:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}
export async function updateDeveloper(developerData, id) {
  try {
    const response = await axiosInstance.put(
      `/developers/${id}`,
      developerData
    );
    return response.data;
  } catch (error) {
    console.error("Failed to update developer:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}
export async function deleteDeveloper(id) {
  try {
    const response = await axiosInstance.delete(`/developers/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete developer:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}

/**
 * Per-client contact overrides for a developer (auth required; not for public client).
 * GET/POST/DELETE `/clients/{clientId}/developers/{developerId}/contact`
 */
export async function getDeveloperContactOverride(clientId, developerId) {
  try {
    const response = await axiosInstance.get(
      `/clients/${clientId}/developers/${developerId}/contact`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to load developer contact override:", error.message);
    return {
      error:
        error.response?.data?.message ||
        error.response?.data?.error_message ||
        error.message,
      code: error.response?.status,
    };
  }
}

export async function setDeveloperContactOverride(clientId, developerId, body) {
  try {
    const response = await axiosInstance.post(
      `/clients/${clientId}/developers/${developerId}/contact`,
      body
    );
    return response.data;
  } catch (error) {
    console.error("Failed to save developer contact override:", error.message);
    return {
      error:
        error.response?.data?.message ||
        error.response?.data?.error_message ||
        error.message,
      code: error.response?.status,
    };
  }
}

export async function deleteDeveloperContactOverride(clientId, developerId) {
  try {
    const response = await axiosInstance.delete(
      `/clients/${clientId}/developers/${developerId}/contact`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to delete developer contact override:", error.message);
    return {
      error:
        error.response?.data?.message ||
        error.response?.data?.error_message ||
        error.message,
      code: error.response?.status,
    };
  }
}

export async function importDevelopers(developers) {
  try {
    const response = await axiosInstance.post(
      `/developers/import_developers`,
      developers
    );
    return response.data;
  } catch (error) {
    console.error("Failed to import developers:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}

export async function importProjects(projects) {
  try {
    const response = await axiosInstance.post(
      `/projects/reference_projects`,
      projects.map((p) => p.id)
    );
    return response.data;
  } catch (error) {
    console.error("Failed to import projects:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}

// Images CRUD operations //
export async function uploadImages(formData, clientId) {
  formData.append("clientId", clientId);
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "Failed to upload images");
  }

  return data;
}
export async function deleteImage(imageId) {
  try {
    const response = await axiosInstance.delete(`/gcs/${imageId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete image:", error.message);
    return { error: error.message };
  }
}

// Bookings CRUD operations //
export async function getAvailableSlots(selectedData) {
  try {
    const response = await axiosInstance.get(
      `/booking/available_slots?selected_date=${selectedData}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch available slots:", error.message);
    return { error: error.message };
  }
}
export async function createBooking(bookingData) {
  try {
    const response = await axiosInstance.post(
      `/booking/create-meeting`,
      bookingData
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create booking:", error.message);
    return { error: error.message };
  }
}

// Sales Team CURD Operations //
// TODO: Get other operation functions from the serviceFetching file and move them to this file
export async function deleteEmployee(id) {
  await axiosInstance.delete(`sales-employees/delete-employee/${id}`);
}

export async function toggleAutoReply(user_id, client_id, value) {
  const payload = {
    user_id,
    client_id,
    toggle_ai_auto_reply: value,
  };

  try {
    await axiosInstance.post("/lenaai-auto-reply", payload);
    return {
      success: true,
      message: "Auto-reply toggled successfully",
    };
  } catch (error) {
    console.error("Failed to toggle auto-reply:", error.message);
    throw error; // Consistent with other API functions
  }
}

// Client Profile API //
// Client Profile API //
export async function getProfileData() {
  try {
    const response = await axiosInstance.get(
      `client/v1/profile`
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch profile data:", error.message);
    return { error: error.message };
  }
}
export async function updateProfileData(formData) {
  try {
    const response = axiosInstance.patch("/client/update-profile", formData);
    return response.data;
  } catch (error) {
    console.error("Failed to update profile data:", error.message);
    return { error: error.message };
  }
}

/**
 * PATCH only enabled_agents on the client profile.
 * @param {import("@/constants/client-agents").ClientAgentId[]} enabledAgents
 */
export async function updateEnabledAgents(enabledAgents) {
  try {
    const response = await axiosInstance.patch("/client/update-profile", {
      enabled_agents: enabledAgents,
    });
    const body = response.data;
    if (body?.status === false) {
      throw new Error(body?.message || "Failed to update automation agents");
    }
    return body;
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update automation agents";
    console.error("Failed to update enabled agents:", message);
    throw new Error(
      typeof message === "string" ? message : "Failed to update automation agents"
    );
  }
}

/** POST multipart client logo (authenticated client). */
export async function uploadClientLogo(formData) {
  try {
    const response = await axiosInstance.post(
      "client/upload-logo",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to upload client logo:", error.message);
    throw error;
  }
}

/** DELETE current client logo (authenticated client). */
export async function deleteClientLogo() {
  try {
    const response = await axiosInstance.delete("client/delete-logo");
    return response.data;
  } catch (error) {
    console.error("Failed to delete client logo:", error.message);
    throw error;
  }
}

// Share Unit Data API //
export async function getShareUnitData(unit_id) {
  const clientId = getValidatedApiClientId();

  if (!clientId) {
    return createApiError(
      'Invalid or missing client ID',
      ERROR_TYPES.AUTHENTICATION,
      401
    );
  }

  try {
    const params = {
      client_id: clientId,
      unit_id: unit_id,
    };

    const response = await axiosInstance.get("/shared-links/share", { params });
    return response.data.data;
  } catch (error) {
    console.error("API Error:", error);
    return { error: error.message };
  }
}

// Chat History API //
export async function resetUnreadMessagesCount(userId) {
  try {
    await axiosInstance.post(`/messages/mark-as-read?user_id=${userId}`);
  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    return { error: error.message };
  }
}

export async function getChatHistory(userId, { limit = 50, offset = 0 } = {}) {
  const response = await axiosInstance.get(`/messages/conversation/${userId}`, {
    params: { limit, offset },
  });
  return response.data;
}

export async function sendClientMessage({
  user_id,
  client_id,
  client_message,
  platform = "website",
  source = "human",
} = {}) {
  if (!user_id) {
    throw new Error("user_id is required");
  }
  if (!client_id) {
    throw new Error("client_id is required");
  }
  const trimmedMessage =
    typeof client_message === "string" ? client_message.trim() : "";
  if (!trimmedMessage) {
    throw new Error("client_message is required");
  }

  try {
    const response = await axiosInstance.post("/chat/client-message", {
      user_id,
      client_id,
      client_message: trimmedMessage,
      platform,
      source,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to send client message:", error.message);
    throw error;
  }
}

/** Read client_id from the CLIENT_ID cookie (access_token is now httpOnly). */
function getClientIdFromToken() {
  if (typeof window === "undefined") return null;
  return LenaCookiesManager.getClientId() ?? null;
}

// HELPER FUNCTIONS //
export function getClientid() {
  const fromToken = getClientIdFromToken();
  if (fromToken) {
    // Validate client ID from token
    const validation = validateClientId(fromToken);
    if (validation.isValid) {
      return validation.sanitizedId;
    }
    console.warn("Invalid client ID in token:", validation.error);
  }
  
  const clientId = LenaCookiesManager.getClientId();
  if (!clientId) {
    console.warn("Client ID not found in access token or cookies, using fallback");
    return "public"; // Fallback for public access
  }
  
  // Validate client ID from cookies
  const validation = validateClientId(clientId);
  if (validation.isValid) {
    return validation.sanitizedId;
  }
  
  console.warn("Invalid client ID in cookies, using fallback:", validation.error);
  return "public"; // Fallback for invalid client IDs
}

/**
 * Gets a validated client ID safe for API usage
 * @returns {string|null} - Validated client ID or null if invalid
 */
export function getValidatedApiClientId() {
  const clientId = getClientid();
  return createSafeClientId(clientId);
}

// Notifications API //
export async function fetchNotifications({ since, unreadOnly, limit = 50 } = {}) {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (since) params.set("since", since);
    if (unreadOnly) params.set("unread_only", "true");

    const response = await axiosInstance.get(`/notifications?${params.toString()}`);

    if (!response.data?.status || !response.data?.data) {
      throw new Error("Invalid response format from server");
    }

    const { notifications, unread_count } = response.data.data;
    if (!Array.isArray(notifications)) {
      throw new Error("Expected notifications array in response");
    }

    return { notifications, unread_count: unread_count ?? 0 };
  } catch (error) {
    console.error("Failed to fetch notifications:", error.message);
    throw error;
  }
}

export async function markNotificationRead(notificationId) {
  try {
    const response = await axiosInstance.post(
      `/notifications/${encodeURIComponent(notificationId)}/read`
    );

    if (!response.data?.status) {
      throw new Error("Failed to mark notification as read");
    }

    return response.data.data;
  } catch (error) {
    console.error("Failed to mark notification as read:", error.message);
    throw error;
  }
}

export async function markAllNotificationsRead() {
  try {
    const response = await axiosInstance.post("/notifications/read-all");

    if (!response.data?.status) {
      throw new Error("Failed to mark all notifications as read");
    }

    return response.data.data;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error.message);
    throw error;
  }
}

// News API //
export async function fetchNews() {
  try {
    const response = await axiosInstance.get("/news/get");

    // Validate response data structure
    if (!response.data || !response.data.data) {
      throw new Error("Invalid response format from server: missing response.data.data");
    }

    // Validate that news is an array
    if (!Array.isArray(response.data.data)) {
      throw new Error(
        `Expected array but received: ${typeof response.data.data}. Response structure: ${JSON.stringify(Object.keys(response.data))}`
      );
    }

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch news:", error.message);
    // Re-throw the error so TanStack Query can handle it properly
    throw error;
  }
}

// Payment Plans API //

function getPaymentPlanApiError(error) {
  const data = error?.response?.data;
  if (data?.error_message) return data.error_message;
  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => item?.msg || item?.message || JSON.stringify(item))
      .join("; ");
  }
  if (typeof data?.detail === "string") return data.detail;
  return error?.message || "Request failed";
}

/** Map UI payload to backend PaymentPlan schema (api.lenaai.net/docs). */
function normalizePaymentPlanPayload(data, { id } = {}) {
  const payload = {
    name: data.name,
    description: data.description ?? "",
    is_default: data.is_default ?? false,
    downpayment_percentage: data.downpayment_percentage,
    installment_years: data.installment_years,
    delivery_in_years: data.delivery_in_years ?? 0,
    maintenance_fee: data.maintenance_fee,
    cache_discount: data.cache_discount ?? 0,
    delivery_payment_percentage: data.delivery_payment_percentage ?? 0,
    installment_increasing_percentage:
      data.installment_increasing_percentage ??
      data.installments_increasing_percentage ??
      0,
    extra_payments: Array.isArray(data.extra_payments) ? data.extra_payments : [],
  };

  if (data.is_common !== undefined) payload.is_common = data.is_common;
  if (id) payload.id = id;
  if (data.updated_at) payload.updated_at = data.updated_at;

  return payload;
}

export async function fetchPaymentPlans({ limit = 100, is_common } = {}) {
  try {
    const params = { limit: String(limit) };
    if (is_common === true) params.is_common = "true";
    const response = await axiosInstance.get("/payment-plans", { params });

    if (!response.data || !response.data.data) {
      throw new Error("Invalid response format from server");
    }

    return response.data;
  } catch (error) {
    console.error("Failed to fetch payment plans:", error.message);
    throw error;
  }
}

export async function createPaymentPlan(paymentPlanData) {
  try {
    const response = await axiosInstance.post(
      "/payment-plans",
      normalizePaymentPlanPayload(paymentPlanData)
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create payment plan:", error.message);
    return {
      error: getPaymentPlanApiError(error),
      status: false,
    };
  }
}

export async function updatePaymentPlan(id, paymentPlanData) {
  try {
    const response = await axiosInstance.put(
      `/payment-plans/${id}`,
      normalizePaymentPlanPayload(paymentPlanData, { id })
    );
    return response.data;
  } catch (error) {
    console.error("Failed to update payment plan:", error.message);
    return {
      error: getPaymentPlanApiError(error),
      status: false,
    };
  }
}

// Data Projection API (Map) //


export async function fetchDataProjection() {
  try {
    const response = await axiosInstance.get("/admin/data-projection");

    // Validate response data structure
    if (!response.data || !response.data.data) {
      throw new Error("Invalid response format from server: missing response.data.data");
    }

    // Validate that data is an array
    if (!Array.isArray(response.data.data)) {
      throw new Error(
        `Expected array but received: ${typeof response.data.data}. Response structure: ${JSON.stringify(Object.keys(response.data))}`
      );
    }

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch data projection:", error.message);
    // Re-throw the error so TanStack Query can handle it properly
    throw error;
  }
}

// X-API-Key is now added server-side by the BFF catch-all (/api/crm/[...path]/route.js)
// for /campaign/* and /whatsapp/* paths — it no longer needs to be in the client bundle.
/** `/campaign/*` expects `x-client-id` to match `client_id` (query/body). */
function campaignChatRequestHeaders(client_id) {
  return {
    "x-client-id": String(client_id),
  };
}

export async function fetchCampaignSessions({ 
  client_id = CAMPAIGN_CHAT_CLIENT_ID, 
  search = "", 
  ai_reply_enabled = null, 
  page = CAMPAIGN_CHAT_PAGINATION.DEFAULT_PAGE, 
  page_size = CAMPAIGN_CHAT_PAGINATION.DEFAULT_PAGE_SIZE 
} = {}) {
  try {
    const params = new URLSearchParams({ 
      client_id, 
      page: String(page), 
      page_size: String(page_size) 
    });
    
    if (search) params.set("search", search);
    if (ai_reply_enabled !== null) params.set("ai_reply_enabled", String(ai_reply_enabled));

    const response = await axiosInstance.get(`${CAMPAIGN_CHAT_ENDPOINTS.SESSIONS}?${params.toString()}`, {
      headers: campaignChatRequestHeaders(client_id),
    });

    if (!response.data || !response.data.data) {
      throw new Error("Invalid response format from server");
    }

    return response.data.data;
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 403 && status !== 401) {
      console.error("Failed to fetch campaign sessions:", error.message);
    }
    throw error;
  }
}

export async function fetchCampaignSession({ 
  client_id = CAMPAIGN_CHAT_CLIENT_ID, 
  phone_number, 
  history_page = CAMPAIGN_CHAT_PAGINATION.DEFAULT_PAGE, 
  history_page_size = CAMPAIGN_CHAT_PAGINATION.DEFAULT_HISTORY_PAGE_SIZE 
} = {}) {
  if (!phone_number) {
    throw new Error("phone_number is required");
  }

  try {
    const normalizedPhone = normalizeCampaignPhoneParam(phone_number);
    const params = new URLSearchParams({ 
      client_id, 
      phone_number: normalizedPhone || String(phone_number), 
      history_page: String(history_page), 
      history_page_size: String(history_page_size) 
    });

    const response = await axiosInstance.get(`${CAMPAIGN_CHAT_ENDPOINTS.SESSION}?${params.toString()}`, {
      headers: campaignChatRequestHeaders(client_id),
    });

    const body = response.data;
    if (!body) {
      throw new Error("Invalid response format from server");
    }

    if (body.status === false) {
      throw new Error(
        body.error_message || body.message || "Failed to load conversation"
      );
    }

    if (!body.data) {
      throw new Error("Invalid response format from server");
    }

    const normalized = normalizeCampaignSessionData(body.data);

    if (
      process.env.NODE_ENV === "development" &&
      normalized.history.length === 0 &&
      Object.keys(body.data || {}).length > 0
    ) {
      console.warn("[campaign-chat] Session loaded but no messages parsed.", {
        dataKeys: Object.keys(body.data || {}),
        phone_number: normalized.phone_number,
      });
    }

    return normalized;
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 403 && status !== 401) {
      console.error("Failed to fetch campaign session:", error.message);
    }
    throw error;
  }
}

export async function toggleCampaignAIReply({ 
  client_id = CAMPAIGN_CHAT_CLIENT_ID, 
  phone_number, 
  ai_reply_enabled 
} = {}) {
  if (!phone_number || ai_reply_enabled === undefined) {
    throw new Error("phone_number and ai_reply_enabled are required");
  }

  try {
    const response = await axiosInstance.post(CAMPAIGN_CHAT_ENDPOINTS.AI_REPLY_TOGGLE, {
      client_id,
      phone_number,
      ai_reply_enabled
    }, {
      headers: campaignChatRequestHeaders(client_id),
    });

    return response.data;
  } catch (error) {
    console.error("Failed to toggle campaign AI reply:", error.message);
    throw error; // Consistent with other API functions
  }
}

export async function updateCampaignSessionName({
  client_id = CAMPAIGN_CHAT_CLIENT_ID,
  phone_number,
  user_name
} = {}) {
  if (!phone_number || !user_name) {
    throw new Error("phone_number and user_name are required");
  }

  try {
    const response = await axiosInstance.post(CAMPAIGN_CHAT_ENDPOINTS.UPDATE_NAME, {
      client_id,
      phone_number,
      user_name
    }, {
      headers: campaignChatRequestHeaders(client_id),
    });
    return response.data;
  } catch (error) {
    console.error("Failed to update session name:", error.message);
    throw error;
  }
}

export async function toggleCampaignFavorite({
  client_id = CAMPAIGN_CHAT_CLIENT_ID,
  phone_number,
  is_favorite
} = {}) {
  if (!phone_number || is_favorite === undefined) {
    throw new Error("phone_number and is_favorite are required");
  }

  try {
    const response = await axiosInstance.post(CAMPAIGN_CHAT_ENDPOINTS.TOGGLE_FAVORITE, {
      client_id,
      phone_number,
      is_favorite
    }, {
      headers: campaignChatRequestHeaders(client_id),
    });
    return response.data;
  } catch (error) {
    console.error("Failed to toggle favorite:", error.message);
    throw error;
  }
}

export async function updateCampaignNotes({
  client_id = CAMPAIGN_CHAT_CLIENT_ID,
  phone_number,
  notes = null
} = {}) {
  if (!phone_number) {
    throw new Error("phone_number is required");
  }

  try {
    const response = await axiosInstance.post(CAMPAIGN_CHAT_ENDPOINTS.UPDATE_NOTES, {
      client_id,
      phone_number,
      notes
    }, {
      headers: campaignChatRequestHeaders(client_id),
    });
    return response.data;
  } catch (error) {
    console.error("Failed to update notes:", error.message);
    throw error;
  }
}

export async function sendWhatsappAutomationMessages({
  client_id = CAMPAIGN_CHAT_CLIENT_ID,
  message = "",
  leads = [],
  image = null,
} = {}) {
  const trimmedMessage = typeof message === "string" ? message.trim() : "";
  if (!trimmedMessage) {
    throw new Error("message is required");
  }
  if (!Array.isArray(leads) || leads.length === 0) {
    throw new Error("leads list is required");
  }

  const payload = {
    client_id,
    message: trimmedMessage,
    leads: leads.map((lead) => ({
      phone_number: String(lead.phone_number ?? "").replace(/\D/g, ""),
      user_name:
        lead.user_name != null && String(lead.user_name).trim()
          ? String(lead.user_name).trim()
          : "",
    })),
  };

  if (image && String(image).trim()) {
    payload.image = String(image).trim();
  }

  try {
    const response = await axiosInstance.post(
      CAMPAIGN_CHAT_ENDPOINTS.WHATSAPP_AUTOMATION_MESSAGE,
      payload,
      { headers: campaignChatRequestHeaders(client_id) }
    );

    const body = response.data;
    if (body?.status === false) {
      throw new Error(
        body.error_message || body.message || "Failed to queue automation messages"
      );
    }

    return body;
  } catch (error) {
    console.error("Failed to send WhatsApp automation messages:", error.message);
    throw error;
  }
}

export async function sendCampaignReply({
  client_id = CAMPAIGN_CHAT_CLIENT_ID, 
  phone_number, 
  admin_reply_text = null, 
  admin_reply_image_url = null, 
  admin_reply_template_name = null, 
  admin_reply_language_code = null,
  provider = null,
  openwa_session_id = null,
  whatsapp_instance_id = null,
  whatsapp_number = null,
  whatsapp_instance_token = null,
} = {}) {
  if (!phone_number) {
    throw new Error("phone_number is required");
  }

  // At least one reply type must be provided for admin replies
  if (!admin_reply_text && !admin_reply_image_url && !admin_reply_template_name) {
    throw new Error("At least one of admin_reply_text, admin_reply_image_url, or admin_reply_template_name is required");
  }

  try {
    const payload = {
      client_id,
      phone_number,
      admin_reply_text,
      admin_reply_image_url,
      admin_reply_template_name,
      admin_reply_language_code,
      provider,
      openwa_session_id,
      whatsapp_instance_id,
      whatsapp_number,
      whatsapp_instance_token,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === null || payload[key] === undefined || payload[key] === "") {
        delete payload[key];
      }
    });

    const response = await axiosInstance.post(CAMPAIGN_CHAT_ENDPOINTS.UNIFIED_REPLY, payload, {
      headers: campaignChatRequestHeaders(client_id),
    });

    return response.data;
  } catch (error) {
    console.error("Failed to send campaign reply:", error.message);
    throw error; // Consistent with other API functions
  }
}

/**
 * Unified WhatsApp send endpoint for both single and bulk messaging.
 * POST /whatsapp/send_messages
 * 
 * @param {Object} options
 * @param {Array} options.messages - Array of message objects:
 *   - phone_number or chat_id (one required): recipient phone or WhatsApp chat id
 *   - message (required): Text body
 *   - user_name (optional): Display name
 *   - platform (optional): Per-message override (openwa | ultramsg | whatsapp)
 *   - sender_phone_number (optional): Linked account phone to send from
 *   - image_url (optional): Image URL
 *   - template_name (optional): WhatsApp template name
 *   - language_code (optional): Template language code
 *   - source (optional): "human" | "ai" — defaults to "human" (rate limited)
 * @param {string} options.default_platform - Optional batch default platform
 * @returns {Promise<Object>} API response with sent/failed counts and results
 */
export async function sendWhatsappMessages({
  messages = [],
  default_platform = null,
  sender_phone_number = null,
} = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("messages array is required and must contain at least one message");
  }

  // Validate each message has required fields
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const recipient = resolveWhatsappRecipientFields(msg);
    if (!recipient) {
      throw new Error(
        `Message at index ${i} missing recipient: provide phone_number or chat_id`,
      );
    }
    // Message is required unless template_name is provided (template-based messaging)
    if (!msg.message && !msg.template_name) {
      throw new Error(`Message at index ${i}: either 'message' or 'template_name' is required`);
    }
  }

  try {
    // Build payload with normalized messages
    const payload = {
      messages: messages.map((msg) => {
        const recipient = resolveWhatsappRecipientFields(msg);
        const normalized = {
          ...recipient,
          message: msg.message ? String(msg.message).trim() : "",
        };

        // Add optional fields
        if (msg.user_name) {
          normalized.user_name = String(msg.user_name).trim();
        }
        if (msg.platform) {
          normalized.platform = String(msg.platform).toLowerCase();
        }
        if (msg.image_url) {
          normalized.image_url = String(msg.image_url).trim();
        }
        if (msg.template_name) {
          normalized.template_name = String(msg.template_name).trim();
        }
        if (msg.language_code) {
          normalized.language_code = String(msg.language_code).trim();
        }
        const resolvedSender = msg.sender_phone_number || sender_phone_number;
        if (resolvedSender) {
          normalized.sender_phone_number = String(resolvedSender).trim();
        }
        normalized.source = resolveWhatsappMessageSource(msg.source);

        return normalized;
      }),
    };

    // Add batch default platform if provided
    if (default_platform) {
      payload.default_platform = String(default_platform).toLowerCase();
    }

    const response = await axiosInstance.post("/whatsapp/send_messages", payload);

    if (!response.data?.status) {
      throw new Error(
        response.data?.message || response.data?.error_message || "Failed to send WhatsApp messages"
      );
    }

    return response.data;
  } catch (error) {
    if (error?.response?.status === 429) {
      const responseData = error.response?.data;
      const rateLimitMessage =
        responseData?.message ||
        responseData?.error_message ||
        "Daily message limit exceeded. Please try again later.";
      const rateLimitError = new Error(rateLimitMessage);
      rateLimitError.code = WHATSAPP_RATE_LIMIT_EXCEEDED_CODE;
      rateLimitError.status = 429;
      throw rateLimitError;
    }
    console.error("Failed to send WhatsApp messages:", error.message);
    throw error;
  }
}

/**
 * Update lead profile fields via POST /action/user/update.
 *
 * Send only the fields being changed (plus required `user_id`). Omitted fields
 * are left untouched server-side. `notes` is append-only (deduplicated) on the
 * backend — it does not replace existing notes.
 *
 * @param {{ user_id: string, phone_number?: string, name?: string, company_name?: string, owner_type?: "owner" | "broker" | "developer", notes?: string }} payload
 */
export async function updateUserInfo(payload) {
  if (!payload?.user_id) {
    throw new Error("user_id is required");
  }
  try {
    const body = {
      user_id: payload.user_id,
      ...(payload.phone_number !== undefined && { phone_number: payload.phone_number }),
      ...(payload.name !== undefined && { name: typeof payload.name === "string" ? payload.name.trim() : payload.name }),
      ...(payload.company_name !== undefined && { company_name: payload.company_name }),
      ...(payload.owner_type !== undefined && { owner_type: payload.owner_type }),
      ...(payload.notes !== undefined && { notes: typeof payload.notes === "string" ? payload.notes.trim() : payload.notes }),
    };
    const response = await axiosInstance.post("/action/user/update", body);
    const data = response.data;

    if (
      data &&
      (data.status === false || data.error_message) &&
      data.status !== true &&
      data.code !== 200 &&
      data.code !== 201
    ) {
      throw new Error(
        data.error_message || data.message || "Failed to update user info",
      );
    }

    return data;
  } catch (error) {
    console.error("Failed to update user info:", error.message);
    throw error;
  }
}

/** Extract the updated lead record from POST /action/user/update response. */
export function extractUpdatedLeadFromUserInfoResponse(response) {
  if (!response || typeof response !== "object") return null;
  if (response.user_id) return response;
  if (response.data?.user_id) return response.data;
  return null;
}

/**
 * Update user name via the action/user/update endpoint
 * @param {string} userId - The user ID to update
 * @param {string} name - The new name for the user
 * @returns {Promise<Object>} The API response with updated user data
 */
export async function updateUserName(userId, name) {
  if (!userId || !name?.trim()) {
    throw new Error("userId and name are required");
  }

  return updateUserInfo({ user_id: userId, name: name.trim() });
}

export async function fetchManagerAnalytics(params = {}) {
  try {
    const response = await axiosInstance.get("/analysis/manager/stats", { params });
    return response.data?.data ?? {};
  } catch (error) {
    console.error("Failed to fetch manager analytics:", error.message);
    throw error;
  }
}

/**
 * @typedef {import("@/types/dashboardSummary").DashboardSummaryData} DashboardSummaryData
 * @typedef {import("@/types/dashboardSummary").FetchDashboardSummaryOptions} FetchDashboardSummaryOptions
 */

/**
 * @param {string} clientId
 * @param {FetchDashboardSummaryOptions} [options]
 * @returns {Promise<DashboardSummaryData | null>}
 */
export async function fetchDashboardSummary(clientId, options = {}) {
  if (!clientId) {
    throw new Error("clientId is required");
  }

  const { refresh = false, startDate, endDate } = options;
  if (!startDate || !endDate) {
    throw new Error("startDate and endDate are required");
  }

  try {
    const params = {
      start_date: toApiStartDate(startDate),
      end_date: toApiEndDate(endDate),
    };
    if (refresh) params.refresh = true;

    const response = await axiosInstance.get(
      `/analysis/dashboard-summary/${encodeURIComponent(clientId)}`,
      { params }
    );
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Failed to fetch dashboard summary:", error.message);
    throw error;
  }
}

export async function fetchLegacyUserAnalytics(days = 10) {
  const clientId = getClientid();
  try {
    const response = await axiosInstance.get(`/analysis/v1/user-analysis/${clientId}`, {
      params: { days },
    });
    return response.data?.data ?? {};
  } catch (error) {
    console.error("Failed to fetch legacy user analytics:", error.message);
    throw error;
  }
}

export async function fetchLegacyMonthData(searchParams = {}) {
  const clientId = getClientid();
  try {
    const params =
      typeof searchParams === "string"
        ? safeMergeParams(searchParams, {})
        : { ...(searchParams || {}) };

    const response = await axiosInstance.get(
      `/analysis/v1/dashboard-action-analysis/${clientId}?days=7`,
      { params }
    );
    return response.data?.data?.monthly ?? [];
  } catch (error) {
    console.error("Failed to fetch legacy month analytics:", error.message);
    throw error;
  }
}

const EMPTY_FOLLOW_UP_TOTALS = {
  leads_scanned: 0,
  followups_sent: 0,
  units_shared: 0,
  meeting_followups: 0,
  first_followups: 0,
  second_followups: 0,
  ignored_prior: 0,
  capped: 0,
  tickets_created: 0,
  skipped_offer: 0,
  skipped_already_engaged: 0,
  excluded_fulfilled: 0,
  errors: 0,
};

export function emptyFollowUpTotals() {
  return { ...EMPTY_FOLLOW_UP_TOTALS };
}

export async function fetchFollowUpSummary(clientId, date) {
  try {
    const response = await axiosInstance.get(
      `/daily-engagement/summary/${encodeURIComponent(clientId)}`,
      {
        params: date ? { date } : undefined,
        validateStatus: (status) => status === 200 || status === 404,
      }
    );

    if (response.status === 404) {
      return null;
    }

    return response.data?.data ?? null;
  } catch (error) {
    console.error("Failed to fetch follow-up summary:", error.message);
    throw error;
  }
}

export async function fetchFollowUpSummaryRange(clientId, start, end) {
  try {
    const response = await axiosInstance.get(
      `/daily-engagement/summary/${encodeURIComponent(clientId)}/range`,
      {
        params: { start, end },
      }
    );

    const data = response.data?.data;
    return {
      summaries: Array.isArray(data?.summaries) ? data.summaries : [],
      count: data?.count ?? 0,
    };
  } catch (error) {
    console.error("Failed to fetch follow-up summary range:", error.message);
    throw error;
  }
}

export async function runDailyEngagement(clientId, dryRun = false) {
  if (!clientId) {
    throw new Error("clientId is required");
  }

  try {
    const response = await axiosInstance.post("/admin/daily-engagement/run", {
      client_id: clientId,
      dry_run: dryRun,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to run daily engagement:", error.message);
    throw error;
  }
}

/**
 * Update a requirement (PUT /requirements/:requirementId).
 *
 * NOTE: This endpoint is keyed by the requirement's own id, NOT by the user's
 * id. The caller is responsible for extracting the requirement id from the
 * GET /requirements/:userId response (any of `id`, `_id`, `requirement_id`).
 */
export async function updateUserRequirements(requirementId, payload) {
  if (!requirementId) {
    throw new Error("requirementId is required");
  }
  const cleanedBody = cleanRequirementsPayload(payload);
  try {
    const response = await axiosInstance.put(
      `requirements/${requirementId}`,
      cleanedBody,
    );
    return response.data;
  } catch (error) {
    console.error("Failed to update requirements:", error.message);
    throw error;
  }
}

/**
 * Create actions for multiple leads (POST /action/v1/create/bulk)
 * @param {Array<Record<string, unknown>>} payloads - One action object per lead
 */
export async function createBulkUserActions(payloads) {
  if (!Array.isArray(payloads) || payloads.length === 0) {
    throw new Error("At least one action payload is required");
  }

  const body = payloads.map((payload) => {
    const actionVal =
      typeof payload.action === "string"
        ? payload.action
        : Array.isArray(payload.action)
          ? payload.action[0]
          : payload.action;
    return {
      phone_number: payload.phone_number ?? "",
      name: payload.name ?? "",
      client_id: payload.client_id,
      user_id: payload.user_id,
      comment: payload.comment ?? "",
      meeting_time: payload.meeting_time ?? null,
      created_at: payload.created_at ?? new Date().toISOString(),
      action: actionVal,
      author: payload.author ?? "",
    };
  });

  try {
    const response = await axiosInstance.post("action/v1/create/bulk", body);
    return response.data;
  } catch (error) {
    console.error("Failed to create bulk actions:", error.message);
    throw error;
  }
}

/**
 * Create a new action (POST /action/v1/create) — client-side helper
 */
export async function createUserAction(payload) {
  const actionVal =
    typeof payload.action === "string"
      ? payload.action
      : Array.isArray(payload.action)
        ? payload.action[0]
        : payload.action;
  const body = {
    phone_number: payload.phone_number ?? "",
    name: payload.name ?? "",
    client_id: payload.client_id,
    user_id: payload.user_id,
    comment: payload.comment ?? "",
    meeting_time: payload.meeting_time ?? null,
    created_at: payload.created_at ?? new Date().toISOString(),
    action: actionVal,
    author: payload.author ?? "",
  };
  try {
    const response = await axiosInstance.post("action/v1/create", body);
    return response.data;
  } catch (error) {
    console.error("Failed to create action:", error.message);
    throw error;
  }
}

/**
 * Update current user action (PUT /action/v1/update/{user_id})
 * Supports partial updates: action, meeting_time, comment, phone_number, name.
 */
export async function updateUserAction(userId, payload = {}) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const body = {
    ...(payload.action !== undefined && { action: payload.action }),
    ...(payload.meeting_time !== undefined && {
      meeting_time: payload.meeting_time || null,
    }),
    ...(payload.comment !== undefined && { comment: payload.comment ?? "" }),
    ...(payload.phone_number !== undefined && {
      phone_number: payload.phone_number,
    }),
    ...(payload.name !== undefined && { name: payload.name }),
  };

  try {
    const response = await axiosInstance.put(`action/v1/update/${userId}`, body);
    return response.data;
  } catch (error) {
    console.error("Failed to update action:", error.message);
    throw error;
  }
}

/**
 * Delete user via the user/delete-user endpoint
 * @param {string} userId - The user ID to delete
 * @param {string} clientId - The client ID (should be 'public')
 * @returns {Promise<Object>} The API response
 */
export async function deleteUser(userId, clientId = "public") {
  if (!userId || !clientId) {
    throw new Error("userId and clientId are required");
  }

  try {
    const response = await axiosInstance.delete("/user/delete-user", {
      data: {
        user_id: userId,
        client_id: clientId
      }
    });
    return response.data;
  } catch (error) {
    console.error("Failed to delete user:", error.message);
    throw error;
  }
}

// Admin Clients API (king admin only)

export async function fetchAdminClients(page = 1, pageSize = 20, search = "") {
  try {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    const trimmedSearch = typeof search === "string" ? search.trim() : "";
    if (trimmedSearch) params.set("search", trimmedSearch);
    // Call the existing king-admin BFF route directly — skip the /api/crm catch-all
    // so we don't double-proxy through /api/crm/api/client/admin/clients.
    const res = await fetch(`/api/client/admin/clients?${params.toString()}`);
    if (!res.ok) throw new Error(`fetchAdminClients: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error("Failed to fetch admin clients:", error.message);
    throw error;
  }
}

export async function updateAdminClient(clientId, payload) {
  try {
    const res = await fetch(`/api/client/admin/clients/${encodeURIComponent(clientId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`updateAdminClient: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error("Failed to update client:", error.message);
    throw error;
  }
}

/**
 * PUT /client/whatsapp-instance — upsert one WhatsApp account by platform (king admin via Next proxy).
 */
export async function upsertClientWhatsappInstance(account, { targetClientId } = {}) {
  const params = new URLSearchParams();
  if (targetClientId) params.set("target_client_id", targetClientId);
  const qs = params.toString();
  const url = `/api/client/whatsapp-instance${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(account),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.error || data.detail || "Failed to update WhatsApp instance"
    );
  }
  return data;
}

/**
 * DELETE /client/whatsapp-instance — unlink one account or all accounts.
 */
export async function deleteClientWhatsappInstance({
  platform,
  whatsapp_number,
  openwa_session_id,
  whatsapp_instance_id,
  targetClientId,
} = {}) {
  const params = new URLSearchParams();
  if (platform) params.set("platform", platform);
  if (whatsapp_number) params.set("whatsapp_number", whatsapp_number);
  if (openwa_session_id) params.set("openwa_session_id", openwa_session_id);
  if (whatsapp_instance_id) {
    params.set("whatsapp_instance_id", whatsapp_instance_id);
  }
  if (targetClientId) params.set("target_client_id", targetClientId);
  const qs = params.toString();
  const url = `/api/client/whatsapp-instance${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, {
    method: "DELETE",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.error || data.detail || "Failed to unlink WhatsApp instance"
    );
  }
  return data;
}

export async function fetchClientPermissionSchema() {
  try {
    const response = await axiosInstance.get("client/permission-schema");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch permission schema:", error.message);
    throw error;
  }
}

/**
 * Delete all client data via the client/delete_all_client_data endpoint
 * @param {string} clientId - The client ID to delete
 * @returns {Promise<Object>} The API response
 */
export async function deleteClient(clientId) {
  if (!clientId) {
    throw new Error("clientId is required");
  }

  try {
    const response = await axiosInstance.delete(
      `/client/delete_all_client_data?client_id=${clientId}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to delete client:", error.message);
    
    // Handle 403 Forbidden - user doesn't have permission
    if (error.response?.status === 403) {
      const permissionError = new Error("You don't have permission to delete clients. King admin access required.");
      permissionError.code = 'PERMISSION_DENIED';
      permissionError.status = 403;
      throw permissionError;
    }
    
    // Handle other errors
    throw error;
  }
}

// --- Match share (public lead unit matching) ---

/**
 * Create a share token for public match page (via Next BFF; proxies backend when available).
 */
export async function createMatchShareToken(payload) {
  const response = await fetch("/api/match/share", {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.status) {
    throw new Error(json?.message || "Failed to create match link");
  }
  return json.data;
}

/**
 * Resolve share context by token (public; uses same-origin BFF).
 */
export async function getMatchShareContext(token) {
  const response = await fetch(`/api/match/share/${encodeURIComponent(token)}`, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.status) {
    throw new Error(json?.message || "Invalid or expired match link");
  }
  return json.data;
}

export async function savePublicUnitReaction(token, unitId, liked) {
  const response = await fetch(
    `/api/match/share/${encodeURIComponent(token)}/reactions`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ unit_id: unitId, liked }),
    },
  );
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.status) {
    throw new Error(json?.message || "Failed to save reaction");
  }
  return json.data;
}

export async function submitMatchViewingRequest(token, { unitIds, meetingTime }) {
  const response = await fetch(
    `/api/match/share/${encodeURIComponent(token)}/viewing-request`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        unit_ids: unitIds,
        meeting_time: meetingTime,
      }),
    },
  );
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json?.status) {
    throw new Error(json?.message || "Failed to submit viewing request");
  }
  return json.data;
}

/**
 * GET /api/openwa/sessions/status — linked OpenWA session connection + QR state.
 */
export async function fetchOpenwaLinkedSessionsStatus() {
  const response = await fetch("/api/openwa/sessions/status", {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error || data?.detail || "Failed to load WhatsApp connection status"
    );
  }

  return data;
}
