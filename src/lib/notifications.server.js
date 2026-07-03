"use server";

import { cache } from "react";
import { cookies } from "next/headers";
import axiosInstance from "@/utils/axiosInstance";
import { COOKIE_KEYS } from "@/constants/cookieKeys";

const EMPTY_NOTIFICATIONS = { notifications: [], unread_count: 0 };

function parseNotificationsResponse(response) {
  const payload = response?.data;
  if (!payload?.status || !payload?.data) return null;
  const { notifications, unread_count } = payload.data;
  if (!Array.isArray(notifications)) return null;
  return { notifications, unread_count: unread_count ?? 0 };
}

async function hasAccessToken() {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value);
}

const fetchNotifications = cache(async function fetchNotifications({
  limit = 50,
  since,
  unreadOnly,
} = {}) {
  if (!(await hasAccessToken())) {
    return EMPTY_NOTIFICATIONS;
  }

  try {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (since) params.set("since", since);
    if (unreadOnly) params.set("unread_only", "true");

    const response = await axiosInstance.get(`/notifications?${params.toString()}`);
    const parsed = parseNotificationsResponse(response);
    if (!parsed) return EMPTY_NOTIFICATIONS;
    return parsed;
  } catch (error) {
    if (error?.response?.status === 401) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[notifications] Unauthorized — returning empty notifications");
      }
      return EMPTY_NOTIFICATIONS;
    }
    throw error;
  }
});

export async function getNotifications(options = {}) {
  return fetchNotifications(options);
}

export async function getUnreadNotificationsCount() {
  try {
    const { unread_count } = await getNotifications({ limit: 1 });
    return unread_count ?? 0;
  } catch {
    return 0;
  }
}
