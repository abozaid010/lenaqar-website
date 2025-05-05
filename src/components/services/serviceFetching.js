'use server';

import axiosInstance from "@/utils/axiosInstance";
import { getClientid } from "./clientCookies";

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

export async function fetchUnitsFilter(searchParams, use) {
  const clientId = await getClientid();

  try {
    const params = {
      ...JSON.parse(searchParams),
      ...(use ? { client_id: clientId } : {}),
    };

    const response = await axiosInstance.get(`${use ? '/units/all' : '/public/units'}`, { params });
    console.log(response);
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
    throw { message: error.response?.data?.message || error.message };
  }
}

// Add this function to your serviceFetching.js file
export async function addUnit(unitData) {
  try {
    const response = await axiosInstance.post(`/units/v1/add-sale`, unitData);
    return response.data;
  } catch (error) {
    console.error("Failed to add unit:", error.message);
    throw { message: error.response?.data?.message || error.message };
  }
}
export async function addUnitRent(unitData) {
  try {
    const response = await axiosInstance.post(`/units/v1/add-rent`, unitData);
    return response.data;
  } catch (error) {
    console.error("Failed to add unit:", error.message);
    throw { message: error.response?.data?.message || error.message };
  }
}

export async function addCompound(compoundData) {
  const clientId = await getClientid();

  try {
    const response = await axiosInstance.post(`/projects/create?client_id=${clientId}`, compoundData);
    return response.data;
  } catch (error) {
    console.error("Failed to add compound:", error.message);
    throw { message: error.response?.data?.message || error.message };
  }
}

export async function getChatHistory(userId) {
  const cookieClientId = await getClientid();

  try {
    const response = await axiosInstance.get(`/messages/messages/${cookieClientId}/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
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

export async function getClientRequirements(phoneNumber) {
  try {
    const response = await axiosInstance.get(`requirements/${phoneNumber}`);
    console.log(response);
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

