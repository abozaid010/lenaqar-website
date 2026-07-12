"use client";

import { useI18n } from "@/hooks/useI18n";
import { useRouter } from "next/navigation";

export default function UnitsGridPagination({
  disableNext,
  nextCursor,
  disablePrev,
  previousCursor,
}) {
  const { t } = useI18n();
  const router = useRouter();

  const handlePageChange = (cursor, direction) => {
    if (!cursor) return;

    const params = new URLSearchParams(window.location.search);
    params.set("cursor", cursor);
    params.set("direction", direction);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 justify-center mt-6 sm:mt-8 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <button
        onClick={() => handlePageChange(previousCursor, "backward")}
        disabled={disablePrev}
        className="min-h-11 px-4 py-2 bg-primary text-white hover:opacity-95 rounded-md text-sm cursor-pointer font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
      >
        {t.previous}
      </button>
      <button
        onClick={() => handlePageChange(nextCursor, "forward")}
        disabled={disableNext}
        className="min-h-11 px-4 py-2 bg-primary text-white hover:opacity-95 rounded-md text-sm cursor-pointer font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
      >
        {t.next}
      </button>
    </div>
  );
}
