"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";

export default function SiteSlogan() {
  const { translate } = useI18n();
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <p className="border-b border-primary/10 bg-primary/[0.06] px-4 py-3 text-center text-sm font-semibold leading-relaxed text-primary sm:text-base">
      {translate("lenaqar.slogan")}
    </p>
  );
}
