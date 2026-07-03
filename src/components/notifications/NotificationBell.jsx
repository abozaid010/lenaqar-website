"use client";

import { SELECTION_COLORS } from "@/constants/colors";
import { useI18n } from "@/hooks/useI18n";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationBell({
  navHref,
  isLinkActive,
  unreadCount = 0,
}) {
  const { translate } = useI18n();

  const href = navHref("/notifications");
  const active = isLinkActive("/notifications");
  const hasUnread = unreadCount > 0;

  return (
    <Link
      href={href}
      prefetch={false}
      className={`flex items-center px-4 py-2 mb-1 gap-2 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
        active ? SELECTION_COLORS.SELECTED : "text-gray-700 hover:bg-gray-100"
      }`}
      aria-label={translate("notifications.title")}
    >
      <Bell
        className={`h-5 w-5 mr-3 shrink-0 ${
          hasUnread ? "text-red-500" : "text-gray-700"
        }`}
      />
      <span className="flex-1 text-start">{translate("sidebar.notifications")}</span>
      {hasUnread && (
        <span className="min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shrink-0">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
