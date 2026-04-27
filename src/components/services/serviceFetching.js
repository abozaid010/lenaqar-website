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
    const response = await axiosInstance.get(
      "sales-employees/list-all-employees"
    );
    
   
    
    return response.data;
  } catch (error) {
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
