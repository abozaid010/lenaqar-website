"use client";

import { axiosInstance } from "@/lib/axiosInstance";
import { safeMergeParams } from "./safeJsonParser";
import { parseExistingProjectData, parseValidationErrors } from "./error-parser";
import CityManager from "./city_manager";
import { CAMPAIGN_CHAT_CLIENT_ID, CAMPAIGN_CHAT_ENDPOINTS, CAMPAIGN_CHAT_PAGINATION } from "@/constants/campaign-chat";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";

// Auth API
export async function loginUser(credentials) {
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('username', credentials.email);
  params.append('password', credentials.password);

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

  return response.data;
}

export async function fetchUsersData(searchParams) {

  try {
    const params = safeMergeParams(searchParams, { limit: 20 });

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

export async function fetchUnitsFilter(searchParams, publicOnly = false) {
  try {
    const params = safeMergeParams(searchParams, { page_size: 16 });

    const response = await axiosInstance.get(
      `${!publicOnly ? "/units/all" : "/public/units"}`,
      { params }
    );

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
}

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

export async function fetchDevelopers(isPublic = false) {
  const url = isPublic ? "/public/developers" : "/developers/";

  try {
    const response = await axiosInstance.get(url);
    // Validate response data structure
    if (!response.data) {
      throw new Error("Invalid response format from server: missing response.data");
    }

    let developersData;

    // Check if data is directly an array (response.data is array)
    if (Array.isArray(response.data)) {
      developersData = response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      // Check if data is nested (response.data.data is array)
      developersData = response.data.data;
    } else {
      // If neither structure matches, throw error
      throw new Error(
        `Unexpected response structure. Expected array or {data: array}, but got: ${JSON.stringify(Object.keys(response.data || {}))}`
      );
    }
    // Sort developersData by name according to app language: ar_name if Arabic, else en_name
    const lang = typeof window !== "undefined" && window.localStorage
      ? window.localStorage.getItem("lang")
      : "en";
    developersData.sort((a, b) => {
      const nameA = (lang === "ar" ? a.ar_name : a.en_name) || "";
      const nameB = (lang === "ar" ? b.ar_name : b.en_name) || "";
      return nameA.localeCompare(nameB, lang === "ar" ? "ar" : "en", { sensitivity: "base" });
    });
    // console.log("=== API Response Data ===", developersData);
    return developersData;
  } catch (error) {
    console.error("Failed to fetch developers data:", error.message);
    console.error("Error details:", error);
    // Re-throw the error so TanStack Query can handle it properly
    throw error;
  }
}

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
export async function fetchProjectsNames(isPublic = false) {
  const url = isPublic ? "/projectsv2/all_projects_names?public=true" : "/projectsv2/all_projects_names";

  try {
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
  } catch (error) {
    console.error("Failed to fetch project names:", error.message);
    // Re-throw the error so TanStack Query can handle it properly
    throw error;
  }
}

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

export async function addUnit(unitData) {
  try {
    const response = await axiosInstance.post(`/units/v1/add-sale`, unitData);
    return response.data;
  } catch (error) {
    console.error("Failed to add unit:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}

export async function addUnitRent(unitData) {
  try {
    const response = await axiosInstance.post(`/units/v1/add-rent`, unitData);
    return response.data;
  } catch (error) {
    console.error("Failed to add unit:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}

export async function addUnitSaleViaExcel(formData) {
  try {
    // v2: import units by developer and return extended summary,
    // including projects_not_updated for optional cleanup.
    const response = await axiosInstance.post(
      `/units/v2/import_units_by_developer`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error("Failed to add units via excel:", error.message);
    return {
      status: false,
      data: null,
      error_message: error.response?.data?.error_message || error.response?.data?.message || error.message,
    };
  }
}

/**
 * Delete only primary units (isPrimary=true) for the given project IDs.
 * Used as a cleanup step after importing developer units when some
 * projects were not updated.
 */
export async function deletePrimaryUnits(projectIds) {
  try {
    const response = await axiosInstance.delete(
      `/units/v2/delete_primary_units`,
      {
        data: {
          project_ids: projectIds,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to delete primary units:", error.message);
    return {
      status: false,
      data: null,
      error_message: error.response?.data?.error_message || error.response?.data?.message || error.message,
    };
  }
}

export async function extractUnitsFromText(text) {
  try {
    const response = await axiosInstance.post(`/units/extract-from-text`, {
      text: text || "",
    });
    return response.data;
  } catch (error) {
    console.error("Failed to extract units from text:", error.message);
    return {
      status: false,
      data: null,
      error_message: error.response?.data?.error_message || error.message,
    };
  }
}

export async function deleteUnit(id) {
  try {
    const response = await axiosInstance.delete(`/units/delete?unit_id=${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete unit:", error.message);
    return { error: error.message };
  }
}

export async function updateUnit(unit) {
  try {
    const response = await axiosInstance.post(`/units/v1/update-sale`, unit);
    return response.data;
  } catch (error) {
    console.error("Failed to update unit:", error.message);
    return { error: error.message };
  }
}

export async function updateUnitRent(unit) {
  try {
    const response = await axiosInstance.post(`/units/v1/update-rent`, unit);
    return response.data;
  } catch (error) {
    console.error("Failed to update unit:", error.message);
    return { error: error.message };
  }
}

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
  // TODO: Cleint ID should be getted from the authantication token
  try {
    const response = await axiosInstance.post(
      `/gcs/upload?client_id=${clientId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to upload images:", error.message);
    return { error: error.message };
  }
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
  try {
    await axiosInstance.delete(`sales-employees/delete-employee/${id}`);
    return true;
  } catch (error) {
    console.error("Failed to fetch sales data:", error.message);
    return { error: error.message };
  }
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

// Share Unit Data API //
export async function getShareUnitData(unit_id) {
  const clientId = getClientid();

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
  if (fromToken) return fromToken;
  const clientId = LenaCookiesManager.getClientId();
  if (!clientId) {
    console.error("Client ID not found in access token or cookies");
    return null;
  }
  return clientId;
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
    const response = await axiosInstance.patch(`/payment-plans/${id}`, paymentPlanData);
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

// Campaign Chat API //
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
        'X-API-Key': process.env.NEXT_PUBLIC_X_API_Key
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
        'X-API-Key': process.env.NEXT_PUBLIC_X_API_Key
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
        'X-API-Key': process.env.NEXT_PUBLIC_X_API_Key
      }
    });

    return response.data;
  } catch (error) {
    console.error("Failed to toggle campaign AI reply:", error.message);
    throw error; // Consistent with other API functions
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
        'X-API-Key': process.env.NEXT_PUBLIC_X_API_Key
      }
    });

    return response.data;
  } catch (error) {
    console.error("Failed to send campaign reply:", error.message);
    throw error; // Consistent with other API functions
  }
}
