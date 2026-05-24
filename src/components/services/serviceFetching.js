"use server";

import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/utils/localized-api-error";
import { getClientid } from "./clientCookies";
import { safeMergeParams } from "@/utils/safeJsonParser";
import { SCHEDULE_VISIBLE_ACTIONS } from "@/utils/actions";

const normalizeAction = (value) => String(value || "").trim().toLowerCase();

export async function getschedual(
  startDate,
  endDate,
  actions = SCHEDULE_VISIBLE_ACTIONS
) {
  try {
    const params = new URLSearchParams();
    params.set("start_date", startDate);
    params.set("end_date", endDate);
    actions.forEach((action) => {
      params.append("action", action);
    });
    const response = await axiosInstance.get(
      `action/scheduled-actions-by-date?${params.toString()}`
    );

    const serverActions = response.data?.data?.actions;
    const actionList = Array.isArray(serverActions) ? serverActions : [];
    const allowedActions = new Set(actions.map(normalizeAction));

    // Keep a client-side guard so schedule never shows disallowed lead actions.
    return actionList.filter((item) =>
      allowedActions.has(normalizeAction(item?.action))
    );
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
    const response = await axiosInstance.post("sales-employees/create-employee", paylod);
    return response.data;
  } catch (error) {
    const message = getApiErrorMessage(error, "Failed to create employee");
    console.error("Failed to create employee:", message);
    throw new Error(message);
  }
}
export async function editExistingEmployee(paylod) {
  try {
    const response = await axiosInstance.put(
      `sales-employees/update-employee/${paylod.id}`,
      paylod
    );
    return response.data;
  } catch (error) {
    const message = getApiErrorMessage(error, "Failed to update employee");
    console.error("Failed to update employee:", message);
    throw new Error(message);
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

export async function fetchManagerStats(searchParams) {
  const clientId = await getClientid();
  try {
    const params = safeMergeParams(searchParams, {
      months: "1",
      range: "daily",
      client_id: clientId,
    });
    const response = await axiosInstance.get("/analysis/manager/stats", { params });
    return response.data?.data ?? {};
  } catch (error) {
    console.error("Failed to fetch manager stats:", error.message);
    return {};
  }
}
