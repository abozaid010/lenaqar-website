'use server';

import axiosInstance from "@/utils/axiosInstance";
import { getClientEmail, getClientid } from "./clientCookies";

export async function fetchUnits() {
  const clientId = await getClientid();

  try {
    const response = await axiosInstance.get(`/units/by-client/${clientId}`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch units:", error.message);
    return { error: error.message };
  }
}

export async function fetchcombounds(use) {

  try {
    const response = await axiosInstance.get(`${use ? `/projects/all` : '/public/projects'}`);

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch units:", error.message);
    return { error: error.message };
  }
}
export async function fetchMyProjects() {
  const clientId = await getClientid();
  try {
    const response = await axiosInstance.get(`/projects/all?client_id=${clientId}`);

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

export async function uploadImages(formData) {
  const clientId = await getClientid();
  try {
    const response = await axiosInstance.post(`/gcs/upload?client_id=${clientId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
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

export async function fetchUnitById(id) {
  try {
    const response = await axiosInstance.get(`/units/details/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch unit by id:", error.message);
    return { error: error.message };
  }
}

export async function fetchUnitByIdpublic(id) {
  try {
    const response = await axiosInstance.get(`/public/unit-details/${id}`, {

    });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch unit by id:", error.message);
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

export async function deleteUnit(id) {
  try {
    const response = await axiosInstance.delete(`/units/delete?unit_id=${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete unit:", error.message);
    return { error: error.message };
  }
}

export async function fetchUsersData(searchParams) {
  const clientId = await getClientid();

  try {
    const params = {
      ...JSON.parse(searchParams),
      limit: 20,
    };

    const response = await axiosInstance.get(`dashboard/${clientId}`, { params });

    return response.data;

  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    return { error: error.message };
  }
}

export async function resetUnreadMessagesCount(userId) {
  try {
    await axiosInstance.post(`/messages/mark-as-read?user_id=${userId}`);

  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    return { error: error.message };
  }
}

export async function fetchUnitsFilter(searchParams, use) {
  const clientId = await getClientid();

  try {
    const params = {
      ...JSON.parse(searchParams),
    };

    use && (params.client_id = clientId);
    const response = await axiosInstance.get(`${use ? '/units/all' : '/public/units'}`, { params });
    return response.data;

  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    return { error: error.message };
  }
}

export async function fetchDevelopers(use) {
  try {
    const response = await axiosInstance.get(`${use ? `/developers/` : '/public/developers'}`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch developers data:", error.message);
    return { error: error.message };
  }
}

export async function addDeveloper(developerData) {
  const clientId = await getClientid();

  try {
    const response = await axiosInstance.post(`/developers/create?client_id=${clientId}`, developerData);
    return response.data;
  } catch (error) {
    console.error("Failed to add developer:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}

export async function getClientDevelopers(client_id) {
  try {
    const response = await axiosInstance.get(`/developers/?client_id=${client_id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch developers:", error.message);
    return { error: error.message };
  }

}
export async function updateDeveloper(developerData, id) {
  try {
    const response = await axiosInstance.put(`/developers/${id}`, developerData);
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

// Add this function to your serviceFetching.js file
export async function addUnit(unitData) {
  try {
    const response = await axiosInstance.post(`/units/v1/add-sale`, unitData);
    return response.data;
  } catch (error) {
    console.error("Failed to add unit:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}
export async function addNewPhase(phaseData, idProject) {
  try {
    const response = await axiosInstance.post(`project-phases/${idProject}/phase-create`, phaseData);

    return response.data;
  } catch (error) {
    console.error("Failed to add unit:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}
export async function updatePhase(phaseData, idProject, idPhase) {
  try {
    const response = await axiosInstance.put(`/project-phases/${idProject}/phase-update/${idPhase}`, phaseData);

    return response.data;
  } catch (error) {
    console.error("Failed to add unit:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}
export async function deletePhase(idProject, idPhase) {
  try {
    const response = await axiosInstance.delete(`/project-phases/${idProject}/phase-delete/${idPhase}`);

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

export async function addCompound(compoundData) {
  const clientId = await getClientid();

  try {
    const response = await axiosInstance.post(`/projects/create?client_id=${clientId}`, compoundData);
    return response.data;
  } catch (error) {
    console.error("Failed to add compound:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}
export async function updatecompound(compoundData, projectId) {
  const clientId = await getClientid();

  try {
    const response = await axiosInstance.patch(`/projects/${projectId}/update-fields`, compoundData);
    console.log(response);
    return response.data;
  } catch (error) {
    console.error("Failed to add compound:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}
export async function deleteProject(project_id) {


  try {
    const response = await axiosInstance.delete(`/projects/delete/${project_id}`);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Failed to add compound:", error.message);
    return { error: error.response?.data?.message || error.message };
  }
}

export async function getChatHistory(userId) {
  const cookieClientId = await getClientid();

  try {
    const response = await axiosInstance.get(`/messages/messages/${cookieClientId}/${userId}`);
    return response.data;
  } catch (error) {
    return error;
  }
}
export async function getschedual(startDate, endDate) {
  // const cookieClientId = await getClientid();

  try {
    const response = await axiosInstance.get(`action/scheduled-actions-by-date?start_date=${startDate}&end_date=${endDate}`);

    return response.data.data.actions;
  } catch (error) {
    return error;
  }
}
export async function assignSalsePerson(id, additionalProp1) {
  // const cookieClientId = await getClientid();


  try {
    const response = await axiosInstance.post(`/sales-employees/${id}/assign-task`, additionalProp1);
    console.log(response.data.data);
    return response.data;
  } catch (error) {
    return error;
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
export async function getprojects(city, district) {
  try {
    const response = await axiosInstance.get(`/projects/get/${city}/${district}`);

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
    return { error: error.message };
  }
}

export async function getClientRequirements(phoneNumber) {
  try {
    const response = await axiosInstance.get(`requirements/${phoneNumber}`);

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
    return { error: error.message };
  }
}

export async function getShareUnitData(unit_id) {
  const clientId = await getClientid();

  try {
    const params = {
      client_id: clientId,
      unit_id: unit_id
    };

    const response = await axiosInstance.get("/shared-links/share", { params });
    return response.data.data;
  } catch (error) {
    console.error("API Error:", error);
    return { error: error.message };
  }
}

export async function toggleAutoReply(phoneNumber, client_id, value) {
  const payload = {
    phone_number: phoneNumber,
    client_id: client_id,
    toggle_ai_auto_reply: value,
    username: "string", // TODO: Replace with actual username
    platform: "website",
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

// #### BOOKING API ####
export async function getAvailableSlots(selectedData) {
  try {
    const response = await axiosInstance.get(`/booking/available_slots?selected_date=${selectedData}`);
    return response.data;

  } catch (error) {
    console.error("Failed to fetch available slots:", error.message);
    return { error: error.message };
  }
}

export async function createBooking(bookingData) {
  try {
    const response = await axiosInstance.post(`/booking/create-meeting`, bookingData);
    return response.data;
  } catch (error) {
    console.error("Failed to create booking:", error.message);
    return { error: error.message };
  }
}

// #### Sales API ####
export async function getSalesData(searchParams) {
  try {
    const response = await axiosInstance.get("sales-employees/list-all-employees");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch sales data:", error.message);
    return { error: error.message };
  }
}

export async function createNewEmployee(paylod) {
  try {
    await axiosInstance.post("sales-employees/create-employee", paylod);
  } catch (error) {
    console.error("Failed to fetch sales data:", error.message);
    return { error: error.message };
  }
}

export async function editExistingEmployee(paylod) {
  try {
    await axiosInstance.put(`sales-employees/update-employee/${paylod.id}`, paylod);
  } catch (error) {
    console.error("Failed to fetch sales data:", error.message);
    return { error: error.message };
  }
}

export async function deleteEmployee(id) {
  try {
    await axiosInstance.delete(`sales-employees/delete-employee/${id}`);
    return true;
  } catch (error) {
    console.error("Failed to fetch sales data:", error.message);
    return { error: error.message };
  }
}

// #### Profile API ####
export async function getProfileData() {
  const clientEmail = await getClientEmail();


  if (!clientEmail) {
    console.error("Client email not found");
    return { error: "Client email not found" };
  }

  try {
    const response = await axiosInstance.get(`client/profile?email=${clientEmail}`);

    return response.data;
  } catch (error) {
    console.error("Failed to fetch profile data:", error.message);
    return { error: error.message };
  }
}

export async function updateProfileData(formData) {
  const clientEmail = getClientEmail();


  if (!clientEmail) {
    console.error("Client email not found");
    return { error: "Client email not found" };
  }

  try {
    const response = axiosInstance.patch("/client/update-profile", formData);
    return response.data;
  } catch (error) {
    console.error("Failed to update profile data:", error.message);
    return { error: error.message };
  }
}

// #### Analytics API ####
export async function userAnalytics(days) {
  const clientId = await getClientid();
  try {
    const response = await axiosInstance.get(`/analysis/v1/user-analysis/${clientId}?days=${days}`);

    return response.data.data;

  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    return { error: error.message };
  }
}
export async function fetchMonthData(searchParams) {
  const clientId = await getClientid();

  try {
    const params = {
      ...JSON.parse(searchParams),

    };
    const response = await axiosInstance.get(`/analysis/v1/dashboard-action-analysis/${clientId}?days=7`, { params });

    return response.data.data.monthly;
  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    return { error: error.message };
  }
}