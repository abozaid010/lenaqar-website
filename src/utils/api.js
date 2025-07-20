"use client";

import { axiosInstance } from "@/lib/axiosInstance";
import Cookies from "js-cookie";

export async function fetchUsersData(searchParams) {
  const clientId = Cookies.get("lena-website-client_id");

  try {
    const params = {
      ...JSON.parse(searchParams),
      limit: 20,
    };

    const response = await axiosInstance.get(`dashboard/${clientId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    return { error: error.message };
  }
}

export async function fetchUnitsFilter(searchParams, publicOnly = false) {
  try {
    const params = {
      ...JSON.parse(searchParams),
    };

    const response = await axiosInstance.get(
      `${!publicOnly ? "/units/all" : "/public/units"}`,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    return { error: error.message };
  }
}

export async function fetchDevelopers(use = true) {
  try {
    const response = await axiosInstance.get(
      `${use ? `/developers/` : "/public/developers"}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch developers data:", error.message);
    return { error: error.message };
  }
}

export async function fetchcombounds(use = true) {
  try {
    const response = await axiosInstance.get(
      `${use ? `/projects/all` : "/public/projects"}`
    );

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch units:", error.message);
    return { error: error.message };
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

export async function fetchUnitById(id) {
  try {
    const response = await axiosInstance.get(`/units/details/${id}`);
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
export async function addCompound(compoundData, clientId) {
  // TODO: Cleint ID should be getted from the authantication token
  try {
    const response = await axiosInstance.post(
      `/projects/create?client_id=${clientId}`,
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
export async function addDeveloper(developerData, clientId) {
  // TODO: Cleint ID should be getted from the authantication token
  try {
    const response = await axiosInstance.post(
      `/developers/create?client_id=${clientId}`,
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
