"use client";

import NotificationList from "@/components/notifications/NotificationList";
import { useI18n } from "@/hooks/useI18n";
import { useNotifications } from "@/hooks/use-notifications";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function NotificationsPageClient() {
  const { translate } = useI18n();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    refetch,
    isFetching,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleNotificationClick = useCallback(
    (notification) => {
      if (!notification?.id) return;

      if (!notification.read) {
        markAsRead(notification.id);
      }

      if (!notification.user_id) return;

      const clientId = LenaCookiesManager.getClientId();
      const prefix = clientId ? `/${clientId}` : "";
      router.push(
        `${prefix}/dashboard?userId=${encodeURIComponent(notification.user_id)}`
      );
    },
    [markAsRead, router]
  );

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">
          {translate("notifications.title")}
        </h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="text-sm font-medium text-primary hover:opacity-80"
          >
            {translate("notifications.readAll")}
          </button>
        )}
      </div>

      <NotificationList
        notifications={notifications}
        unreadCount={unreadCount}
        isLoading={isLoading}
        isError={isError}
        refetch={refetch}
        isFetching={isFetching}
        onMarkAllAsRead={markAllAsRead}
        onNotificationClick={handleNotificationClick}
        variant="page"
      />
    </div>
  );
}
