import NotificationsPageClient from "./_components/notifications-page-client";
import { getNotifications } from "@/lib/notifications.server";

export const metadata = {
  title: "Notifications | LENAAI",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const { notifications, unread_count } = await getNotifications({ limit: 50 });
  return (
    <NotificationsPageClient
      initialNotifications={notifications}
      initialUnreadCount={unread_count}
    />
  );
}
