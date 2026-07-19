"use server";

import axiosInstance from "@/utils/axiosInstance";

/**
 * @returns {Promise<{ cards: object[], count: number } | { unavailable: true } | null>}
 */
export async function fetchMarketCards({ status, limit } = {}) {
  try {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (limit != null) params.set("limit", String(limit));
    const qs = params.toString();
    const res = await axiosInstance.get(
      `/market-index/cards${qs ? `?${qs}` : ""}`
    );
    if (res.data?.status === true) return res.data.data ?? { cards: [], count: 0 };
    return null;
  } catch (error) {
    if (error?.response?.status === 403) return { unavailable: true };
    return null;
  }
}

/**
 * @returns {Promise<{ card: object, units: object[] } | { unavailable: true } | null>}
 * null = no draft yet (404) or other failure.
 */
export async function fetchMarketCard(locationId) {
  try {
    const res = await axiosInstance.get(
      `/market-index/cards/${encodeURIComponent(locationId)}`
    );
    if (res.data?.status === true) return res.data.data ?? null;
    return null;
  } catch (error) {
    if (error?.response?.status === 403) return { unavailable: true };
    if (error?.response?.status === 404) return null;
    return null;
  }
}

/**
 * @returns {Promise<object | null>}
 */
export async function fetchLocation(locationId) {
  try {
    const res = await axiosInstance.get(
      `/market-index/locations/${encodeURIComponent(locationId)}`
    );
    if (res.data?.status === true) return res.data.data ?? null;
    return null;
  } catch {
    return null;
  }
}
