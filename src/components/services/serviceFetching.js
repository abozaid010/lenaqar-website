"use server";

import axiosInstance from "@/utils/axiosInstance";
import { getClientid } from "./clientCookies";

export async function fetchUnitByIdpublic(id) {
  try {
    const response = await axiosInstance.get(`/public/unit-details/${id}`, {});
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch unit by id:", error.message);
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

export async function getChatHistory(userId) {
  const cookieClientId = await getClientid();

  try {
    const response = await axiosInstance.get(
      `/messages/messages/${cookieClientId}/${userId}`
    );
    return response.data;
  } catch (error) {
    return error;
  }
}
export async function getschedual(startDate, endDate) {
  try {
    const response = await axiosInstance.get(
      `action/scheduled-actions-by-date?start_date=${startDate}&end_date=${endDate}`
    );

    return response.data.data.actions;
  } catch (error) {
    return error;
  }
}
export async function assignSalsePerson(id, additionalProp1) {
  try {
    const response = await axiosInstance.post(
      `/sales-employees/${id}/assign-task`,
      additionalProp1
    );
    return response.data;
  } catch (error) {
    return error;
  }
}

export async function getShareUnitData(unit_id) {
  const clientId = await getClientid();

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

// #### Sales API ####
export async function getSalesData() {
  try {
    const response = await axiosInstance.get(
      "sales-employees/list-all-employees"
    );
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
    await axiosInstance.put(
      `sales-employees/update-employee/${paylod.id}`,
      paylod
    );
  } catch (error) {
    console.error("Failed to fetch sales data:", error.message);
    return { error: error.message };
  }
}

// #### Analytics API ####
export async function userAnalytics(days) {
  const clientId = await getClientid();
  try {
    const response = await axiosInstance.get(
      `/analysis/v1/user-analysis/${clientId}?days=${days}`
    );

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
    const response = await axiosInstance.get(
      `/analysis/v1/dashboard-action-analysis/${clientId}?days=7`,
      { params }
    );

    return response.data.data.monthly;
  } catch (error) {
    console.error("Failed to fetch users:", error.message);
    return { error: error.message };
  }
}
