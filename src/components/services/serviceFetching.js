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

export async function fetchcombounds() {
  try {
    const response = await axiosInstance.get(`/projects/all`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch units:", error.message);
    return { error: error.message };
  }
}

export async function uploadImages(formData) {
  try {
    const response = await axiosInstance.post(`/images/`, formData, {

      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("responseImage", response);
    return response.data;

  } catch (error) {
    console.error("Failed to upload images:", error.message);
    return { error: error.message };
  }
}

export async function deleteImage(imageId) {
  try {
    const response = await axiosInstance.delete(`/images/${imageId}`);
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
    const response = await axiosInstance.post(`/units/update-sale`, unit);
    return response.data;
  } catch (error) {
    console.error("Failed to update unit:", error.message);
    return { error: error.message };
  }
}
export async function updateUnitRent(unit) {
  try {
    const response = await axiosInstance.post(`/units/update-rent`, unit);
    return response.data;
  } catch (error) {
    console.error("Failed to update unit:", error.message);
    return { error: error.message };
  }
}

export async function deleteUnit(id) {
  try {
    const response = await axiosInstance.delete(`/units/delete?unit_id=${id}`, {

    });
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
export async function fetchUnitsFilter(searchParams) {
  const clientId = await getClientid();

  try {
    const params = {
      ...JSON.parse(searchParams),
      client_id: clientId, // include client_id in query params
    
    };
    console.log("params",params)

    const response = await axiosInstance.get('/units/all', { params });
    console.log(response)
    return response.data;

  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    return { error: error.message };
  }
}


export async function fetchDevelopers() {
  try {
    const response = await axiosInstance.get(`/developers/`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch developers data:", error.message);
    return { error: error.message };
  }
}

export async function addDeveloper(developerData) {
  try {
    const response = await axiosInstance.post(`/developers/create`, developerData);
    return response.data;
  } catch (error) {
    console.error("Failed to add developer:", error.message);
    throw { message: error.response?.data?.message || error.message };
  }
}

// Add this function to your serviceFetching.js file
export async function addUnit(unitData) {
  try {
    const response = await axiosInstance.post(`/units/add-sale`, unitData);
    return response.data;
  } catch (error) {
    console.error("Failed to add unit:", error.message);
    throw { message: error.response?.data?.message || error.message };
  }
}
export async function addUnitRent(unitData) {
  try {
    const response = await axiosInstance.post(`/units/add-rent`, unitData);
    return response.data;
  } catch (error) {
    console.error("Failed to add unit:", error.message);
    throw { message: error.response?.data?.message || error.message };
  }
}

export async function addCompound(compoundData) {
  try {
    const response = await axiosInstance.post(`/projects/create`, compoundData);
    return response.data.data;
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
  const cookieClientId = await getClientid();

  const requirementsId = `${phoneNumber}_${cookieClientId}`;

  try {
    const response = await axiosInstance.get(`requirements/${requirementsId}`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch data:", error.message);
    return { error: error.message };
  }
}