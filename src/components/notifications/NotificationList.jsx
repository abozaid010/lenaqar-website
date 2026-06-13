"use client";

import { useI18n } from "@/hooks/useI18n";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Loader2, RotateCcw } from "lucide-react";

export default function NotificationList({
  notifications,
  unreadCount,
  isLoading,
  isError,
  refetch,
  isFetching,
  onMarkAllAsRead,
  onNotificationClick,
  variant = "page",
}) {
  const { translate, locale } = useI18n();
  const dateLocale = locale === "ar" ? ar : enUS;
  const isPage = variant === "page";

  const containerClass = isPage
    ? "bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden"
    : "w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[min(420px,calc(100vh-6rem))]";

  return (
    <div className={containerClass}>
      {!isPage && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
          <h3 className="text-sm font-semibold text-gray-900">
            {translate("notifications.title")}
          </h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => onMarkAllAsRead()}
              className="text-xs font-medium text-primary hover:opacity-80 whitespace-nowrap"
            >
              {translate("notifications.readAll")}
            </button>
          )}
        </div>
      )}

      <div className={isPage ? "" : "overflow-y-auto flex-1 min-h-0"}>
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-sm text-gray-600 mb-3">
              {translate("notifications.loadError")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 disabled:opacity-50"
            >
              <RotateCcw
                className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
              {translate("common.retry")}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-16 px-4">
            {translate("notifications.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const isUnread = !notification.read;
              const relativeTime = notification.createdAt
                ? formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })
                : "";

              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => onNotificationClick(notification)}
                    className={`w-full text-start px-4 py-4 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 ${
                      isUnread ? "bg-primary/5" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isUnread && (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500"
                          aria-hidden
                        />
                      )}
                      <div className={`min-w-0 flex-1 ${isUnread ? "" : "ps-5"}`}>
                        <p
                          className={`text-sm ${
                            isUnread
                              ? "font-semibold text-gray-900"
                              : "font-medium text-gray-600"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="text-sm text-gray-500 mt-1">
                            {notification.body}
                          </p>
                        )}
                        {(notification.user_name || notification.action_type) && (
                          <p className="text-xs text-gray-400 mt-2">
                            {[notification.user_name, notification.action_type]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                        {relativeTime && (
                          <p className="text-xs text-gray-400 mt-1">
                            {relativeTime}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
