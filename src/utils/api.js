"use client";

import { axiosInstance } from "@/lib/axiosInstance";
import { safeMergeParams } from "./safeJsonParser";
import { parseExistingProjectData, parseValidationErrors } from "./error-parser";
import CityManager from "./city_manager";
import { CAMPAIGN_CHAT_CLIENT_ID, CAMPAIGN_CHAT_ENDPOINTS, CAMPAIGN_CHAT_PAGINATION } from "@/constants/campaign-chat";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { withErrorHandling, createApiError, ERROR_TYPES } from "./api-error-handler";
import { validateClientId, createSafeClientId } from "./clientId-validator";
import { with2SecondRetry } from "./api-retry";

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
        ? safeMergeParams(searchParams, { limit: 20 })
        : { limit: 20, ...(searchParams || {}) };
    const params = {
      ...merged,
      limit: merged.limit ?? 20,
      ...(pageParam?.cursor
        ? { cursor: pageParam.cursor, direction: pageParam.direction ?? "forward" }
        : {}),
    };

    const response = await axiosInstance.get(`messages/all`, {
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
    console.log("=== API Response Data ===", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    // Re-throw the error so TanStack Query can handle it properly
    throw error;
  }
}

const fetchUnitsFilterBase = async (searchParams, publicOnly = false) => {
  try {
    const params = safeMergeParams(searchParams, { page_size: 16 });
    const url = `${!publicOnly ? "/units/all" : "/public/units"}`;
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

    return response.data;
  } catch (error) {
    console.error("Failed to fetch units:", error.message);
    // Re-throw the error so TanStack Query can handle it properly
    throw error;
  }
};

export const fetchUnitsFilter = with2SecondRetry(fetchUnitsFilterBase);

/**
 * Fetches units from /units/all for the Resale page.
 * Always sends is_primary: false. When filter is "all", only is_primary is sent; otherwise
 * sends visibility (e.g. "pending_approval", "visible", "hidden") or dataSource: "ai_generated".
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
      is_primary: false,
      ...(parsed.cursor != null && parsed.cursor !== ""
        ? { cursor: parsed.cursor }
        : {}),
    };

    // "All" = only is_primary: false. Otherwise: dataSource XOR visibility
    if (parsed.dataSource === "ai_generated") {
      params.dataSource = "ai_generated";
    } else if (parsed.visibility != null && parsed.visibility !== "") {
      params.visibility = parsed.visibility;
    }

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
  
  console.log(`🔍 Fetching developers with pagination: ${url}`);

  // Debug: Check if access token is available
  const accessToken = require("@/lib/LenaCookiesManager").LenaCookiesManager?.getAccessToken?.();
  console.log(`🔐 Access token available: ${!!accessToken ? 'YES' : 'NO'}`);

  const response = await axiosInstance.get(url);
  
  console.log(`✅ Developers pagination API response status: ${response.status}`);
  
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
    formData
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

export async function toggleAutoReply(user_id, client_id, value, source) {
  const payload = {
    user_id,
    client_id,
    toggle_ai_auto_reply: value,
    platform: source,
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

// Client-side decode JWT payload (no verification; API verifies when token is sent).
function decodeJwtPayloadClient(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
    return typeof payload === "object" && payload !== null ? payload : null;
  } catch {
    return null;
  }
}

/** Prefer client_id from access token; fallback to CLIENT_ID cookie. */
function getClientIdFromToken() {
  if (typeof window === "undefined") return null;
  const token = LenaCookiesManager.getAccessToken();
  const payload = decodeJwtPayloadClient(token);
  return payload?.client_id ?? payload?.sub ?? null;
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
export async function fetchPaymentPlans({ limit = 100, is_common } = {}) {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (is_common === true) params.set("is_common", "true");
    const response = await axiosInstance.get(`/payment-plans/?${params.toString()}`);
    
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
    const response = await axiosInstance.post('/payment-plans/', paymentPlanData);
    return response.data;
  } catch (error) {
    console.error("Failed to create payment plan:", error.message);
    return { 
      error: error.response?.data?.error_message || error.message,
      status: false
    };
  }
}

export async function updatePaymentPlan(id, paymentPlanData) {
  try {
    // Include ID in the request body as required by the API
    const requestBody = {
      ...paymentPlanData,
      id: id
    };
    const response = await axiosInstance.put(`/payment-plans/${id}`, requestBody);
    return response.data;
  } catch (error) {
    console.error("Failed to update payment plan:", error.message);
    return { 
      error: error.response?.data?.error_message || error.message,
      status: false
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
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_X_API_KEY
      }
    });

    if (!response.data || !response.data.data) {
      throw new Error("Invalid response format from server");
    }

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch campaign sessions:", error.message);
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
    const params = new URLSearchParams({ 
      client_id, 
      phone_number, 
      history_page: String(history_page), 
      history_page_size: String(history_page_size) 
    });

    const response = await axiosInstance.get(`${CAMPAIGN_CHAT_ENDPOINTS.SESSION}?${params.toString()}`, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_X_API_KEY
      }
    });

    if (!response.data || !response.data.data) {
      throw new Error("Invalid response format from server");
    }

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch campaign session:", error.message);
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
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_X_API_KEY
      }
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
      headers: { 'X-API-Key': process.env.NEXT_PUBLIC_X_API_KEY }
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
      headers: { 'X-API-Key': process.env.NEXT_PUBLIC_X_API_KEY }
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
      headers: { 'X-API-Key': process.env.NEXT_PUBLIC_X_API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error("Failed to update notes:", error.message);
    throw error;
  }
}

export async function sendCampaignReply({
  client_id = CAMPAIGN_CHAT_CLIENT_ID, 
  phone_number, 
  admin_reply_text = null, 
  admin_reply_image_url = null, 
  admin_reply_template_name = null, 
  admin_reply_language_code = null 
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
      admin_reply_language_code
    };

    // Remove null values
    Object.keys(payload).forEach(key => {
      if (payload[key] === null) delete payload[key];
    });

    const response = await axiosInstance.post(CAMPAIGN_CHAT_ENDPOINTS.UNIFIED_REPLY, payload, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_X_API_KEY
      }
    });

    return response.data;
  } catch (error) {
    console.error("Failed to send campaign reply:", error.message);
    throw error; // Consistent with other API functions
  }
}

/**
 * Update user profile fields via POST /action/user/update
 * @param {{ user_id: string, phone_number?: string, name?: string, company_name?: string }} payload
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
    };
    const response = await axiosInstance.post("/action/user/update", body);
    return response.data;
  } catch (error) {
    console.error("Failed to update user info:", error.message);
    throw error;
  }
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

/**
 * Update requirements for a user (PUT /requirements/:userId)
 */
export async function updateUserRequirements(userId, payload) {
  if (!userId) {
    throw new Error("userId is required");
  }
  try {
    const response = await axiosInstance.put(`requirements/${userId}`, payload);
    return response.data;
  } catch (error) {
    console.error("Failed to update requirements:", error.message);
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

export async function fetchAdminClients(page = 1, pageSize = 10) {
  try {
    const response = await axiosInstance.get("/api/client/admin/clients", {
      params: { page, page_size: pageSize },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch admin clients:", error.message);
    throw error;
  }
}

export async function updateAdminClient(clientId, payload) {
  try {
    const response = await axiosInstance.patch(
      `/api/client/admin/clients/${clientId}`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to update client:", error.message);
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
