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

export async function fetchUnitsFilter(searchParams, use = true) {
  try {
    const params = {
      ...JSON.parse(searchParams),
    };

    const response = await axiosInstance.get(
      `${use ? "/units/all" : "/public/units"}`,
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

export async function fetchCitisAndProjects() {
  try {
    const response = await axiosInstance.get("/projects/cities-and-districts");

    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch units:", error.message);
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
