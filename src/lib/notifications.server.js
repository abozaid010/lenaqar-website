"use server";

import axiosInstance from "@/utils/axiosInstance";

function parseNotificationsResponse(response) {
  const payload = response?.data;
  if (!payload?.status || !payload?.data) return null;
  const { notifications, unread_count } = payload.data;
  if (!Array.isArray(notifications)) return null;
  return { notifications, unread_count: unread_count ?? 0 };
}

export async function getNotifications({ limit = 50, since, unreadOnly } = {}) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (since) params.set("since", since);
  if (unreadOnly) params.set("unread_only", "true");

  const response = await axiosInstance.get(`/notifications?${params.toString()}`);
  const parsed = parseNotificationsResponse(response);
  if (!parsed) throw new Error("Invalid notifications response");
  return parsed;
}

export async function getUnreadNotificationsCount() {
  try {
    const { unread_count } = await getNotifications({ limit: 1 });
    return unread_count ?? 0;
  } catch {
    return 0;
  }
}

