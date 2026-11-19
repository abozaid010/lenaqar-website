"use client";

import { usePathname } from "next/navigation";
import CoreActions from "./core-actions";

export default function StickyActionsBar() {
  const pathname = usePathname();
  const path = String(pathname || "");
  // The match page has its own bar: WhatsApp and Call.
  if (path.startsWith("/network") || path.startsWith("/requests/match/")) return null;

  return (
    <div className="lq-sticky-actions fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-black/10 bg-white px-4 py-3">
      <CoreActions location="sticky_bar" layout="row" className="w-full" />
    </div>
  );
}
