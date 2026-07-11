"use client";

import { notificationKeys } from "@/utils/query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

async function markAllNotificationsReadBFF() {
  const res = await fetch("/api/crm/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markAll: true }),
  });
  if (!res.ok) throw new Error(`Mark-all-read BFF error: ${res.status}`);
  return res.json();
}

const READ_IDS_KEY = "lenaNotificationReadIds";

function loadReadIds() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persistReadIds(ids) {
  if (typeof window === "undefined") return;
  localStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids]));
}

function readIdsToArray(ids) {
  return [...ids];
}

export function useNotifications({
  initialNotifications = [],
  initialUnreadCount = 0,
} = {}) {
  const queryClient = useQueryClient();

  const readIdsQuery = useQuery({
    queryKey: notificationKeys.readIds(),
    queryFn: () => readIdsToArray(loadReadIds()),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const readIds = useMemo(
    () => new Set(readIdsQuery.data || []),
    [readIdsQuery.data]
  );

  const updateReadIds = useCallback(
    (updater) => {
      queryClient.setQueryData(notificationKeys.readIds(), (prev) => {
        const current = new Set(prev || loadReadIds());
        const next = updater(current);
        persistReadIds(next);
        return readIdsToArray(next);
      });
    },
    [queryClient]
  );

  // Notifications are fetched on the server and passed in as initial props.
  // Keeping this hook client-only avoids a browser-visible GET to `/api/crm/notifications`.
  const rawNotifications = initialNotifications || [];

  const notifications = useMemo(
    () =>
      rawNotifications.map((n) => ({
        ...n,
        read: readIds.has(n.id),
      })),
    [rawNotifications, readIds]
  );

  const unreadCount = useMemo(() => {
    // Prefer derived count from readIds (client overrides server unread).
    const derived = notifications.filter((n) => !n.read).length;
    return Number.isFinite(derived) ? derived : initialUnreadCount ?? 0;
  }, [notifications, initialUnreadCount]);

  const markAsRead = useCallback(
    (notificationId) => {
      updateReadIds((prev) => {
        if (prev.has(notificationId)) return prev;
        const next = new Set(prev);
        next.add(notificationId);
        return next;
      });
    },
    [updateReadIds]
  );

  const markAllAsRead = useCallback(async () => {
    updateReadIds((prev) => {
      const next = new Set(prev);
      for (const n of rawNotifications) {
        if (n?.id) next.add(n.id);
      }
      return next;
    });

    try {
      await markAllNotificationsReadBFF();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error?.message ?? error);
    }
  }, [rawNotifications, updateReadIds]);

  return {
    notifications,
    unreadCount,
    isLoading: false,
    isError: false,
    error: null,
    refetch: async () => {},
    isFetching: false,
    markAsRead,
    markAllAsRead,
  };
}
