"use client";

import { axiosInstance } from "@/lib/axiosInstance";
import Cookies from "js-cookie";
import { safeMergeParams } from "./safeJsonParser";

export async function fetchUsersData(searchParams) {
  const clientId = getClientid();

  try {
    const params = safeMergeParams(searchParams, { limit: 16 });

    const response = await axiosInstance.get(`dashboard/${clientId}`, {
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

    // Validate pagination exists (optional but good to check)
    if (response.data.data.pagination === undefined) {
      console.warn("Pagination data missing in response");
    }

    return response.data;
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

    // console.log("=== API Response Data ===", developersData);
    return developersData;
  } catch (error) {
    console.error("Failed to fetch developers data:", error.message);
    console.error("Error details:", error);
    // Re-throw the error so TanStack Query can handle it properly
    throw error;
  }
}

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

export async function fetchCitisAndProjects() {
  try {
    const response = await axiosInstance.get("/projects/cities-and-districts");

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch units:", error.message);

    return { error: error.message };
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
    const response = await axiosInstance.post(
      `/units/v1/import_units`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error("Failed to add units via excel:", error.message);
    return { error: error.response?.data?.message || error.message };
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
    return { error: error.response?.data?.error_message || error.message };
  }
}
export async function updatecompound(compoundData, projectId) {
  try {
    const response = await axiosInstance.patch(
      `/projects/${projectId}/update-fields`,
      compoundData
    );
    return response.data;
  } catch (error) {
    return { error: error.response?.data?.error_message || error.message };
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
      `/projects/import_projects`,
      projects
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
  } catch (e) {
    return {
      success: false,
      message: "Failed to toggle auto-reply",
    };
  }
}

// Client Profile API //
export async function getProfileDataByEmail(clientEmail) {
  try {
    const response = await axiosInstance.get(
      `client/profile?email=${clientEmail}`
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

export async function getChatHistory(userId) {
  const cookieClientId = getClientid();

  try {
    const response = await axiosInstance.get(
      `/messages/messages/${cookieClientId}/${userId}`
    );
    return response.data;
  } catch (error) {
    return error;
  }
}

// HELPER FUNCTIONS //
export function getClientid() {
  const clientId = Cookies.get("lena-website-client_id");
  if (!clientId) {
    console.error("Client ID not found in cookies");
    return null;
  }
  return clientId;
}
