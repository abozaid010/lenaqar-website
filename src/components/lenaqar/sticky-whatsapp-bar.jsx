"use client";

import { usePathname } from "next/navigation";
import CoreActions from "./core-actions";

export default function StickyActionsBar() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "/lenaqar";
  if (isHome) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-black/10 bg-white px-4 py-3">
      <CoreActions layout="row" className="w-full" />
    </div>
  );
}
