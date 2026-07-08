"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquareText, Newspaper } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { getClientid } from "@/utils/api";

const tabs = [
  { path: "/social-media/dashboard", icon: LayoutDashboard, labelKey: "socialMedia.nav.dashboard" },
  { path: "/social-media/posts", icon: Newspaper, labelKey: "socialMedia.nav.posts" },
  { path: "/social-media/comments", icon: MessageSquareText, labelKey: "socialMedia.nav.comments" },
] as const;

export function SocialMediaNav() {
  const pathname = usePathname();
  const { translate } = useI18n();
  const clientId = getClientid();
  const prefix = clientId ? `/${clientId}` : "";

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 mb-1"
      aria-label={translate("socialMedia.nav.label")}
    >
      {tabs.map(({ path, icon: Icon, labelKey }) => {
        const href = `${prefix}${path}`;
        const active = pathname?.includes(path);
        return (
          <Link
            key={path}
            href={href}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {translate(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
