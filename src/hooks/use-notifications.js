"use client";

import {
  fetchNotifications,
  markAllNotificationsRead,
} from "@/utils/api";
import { notificationKeys } from "@/utils/query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef } from "react";

const LAST_POLL_KEY = "lastNotificationPollAt";
const READ_IDS_KEY = "lenaNotificationReadIds";
const POLL_INTERVAL_MS = 60_000;

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

function mergeNotifications(newItems, existingItems) {
  const map = new Map();
  for (const item of newItems || []) {
    if (item?.id) map.set(item.id, item);
  }
  for (const item of existingItems || []) {
    if (item?.id && !map.has(item.id)) map.set(item.id, item);
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const hasInitialLoadRef = useRef(false);

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

  const query = useQuery({
    queryKey: notificationKeys.list(),
    queryFn: async () => {
      if (!hasInitialLoadRef.current) {
        hasInitialLoadRef.current = true;
        const data = await fetchNotifications({ limit: 50 });
        if (typeof window !== "undefined") {
          sessionStorage.setItem(LAST_POLL_KEY, new Date().toISOString());
        }
        return data;
      }

      const since =
        typeof window !== "undefined"
          ? sessionStorage.getItem(LAST_POLL_KEY)
          : null;

      const incremental = since
        ? await fetchNotifications({ since, limit: 50 })
        : await fetchNotifications({ limit: 50 });

      if (typeof window !== "undefined") {
        sessionStorage.setItem(LAST_POLL_KEY, new Date().toISOString());
      }

      const prev = queryClient.getQueryData(notificationKeys.list());
      const prevNotifications = prev?.notifications || [];
      const newItems = incremental.notifications || [];
      const merged = mergeNotifications(newItems, prevNotifications);

      return {
        notifications: merged,
        unread_count: incremental.unread_count ?? prev?.unread_count ?? 0,
      };
    },
    staleTime: 0,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  const rawNotifications = query.data?.notifications || [];

  const notifications = useMemo(
    () =>
      rawNotifications.map((n) => ({
        ...n,
        read: readIds.has(n.id),
      })),
    [rawNotifications, readIds]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

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

    queryClient.setQueryData(notificationKeys.list(), (old) => {
      if (!old) return old;
      return { ...old, unread_count: 0 };
    });

    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [rawNotifications, updateReadIds, queryClient]);

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
    markAsRead,
    markAllAsRead,
  };
}
