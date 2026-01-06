"use server";

import axiosInstance from "@/utils/axiosInstance";
import { getClientid } from "./clientCookies";
import { safeMergeParams } from "@/utils/safeJsonParser";

export async function getschedual(startDate, endDate) {
  try {
    const response = await axiosInstance.get(
      `action/scheduled-actions-by-date?start_date=${startDate}&end_date=${endDate}`
    );

    return response.data.data.actions;
  } catch (error) {
    console.error("Failed to fetch schedule data:", error.message);
    // Return empty array instead of error to prevent server crashes
    return [];
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
    console.error("Failed to assign sales person:", error.message);
    throw error; // Re-throw to handle in component
  }
}

// #### Sales API ####
export async function getSalesData() {
  try {
    console.log("[getSalesData] Initiating API request to: sales-employees/list-all-employees");
    const response = await axiosInstance.get(
      "sales-employees/list-all-employees"
    );
    
    console.log("[getSalesData] API Response Status:", response.status);
    console.log("[getSalesData] Response structure:", {
      hasData: !!response.data,
      hasDataData: !!response.data?.data,
      hasStatus: 'status' in (response.data || {}),
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      isDataArray: Array.isArray(response.data?.data),
      dataLength: Array.isArray(response.data?.data) ? response.data.data.length : 'N/A',
    });
    console.log("[getSalesData] Full response.data:", JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error("[getSalesData] Failed to fetch sales data:", {
      message: error.message,
      name: error.name,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      },
    });
    // Return empty data structure with status to prevent server crashes
    // This matches the expected response structure
    return { data: [], status: false };
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
    const params = safeMergeParams(searchParams, {});
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
