"use client";

import { useI18n } from "@/context/translate-api";
import { useRouter } from "next/navigation";

export default function UnitsGridPagination({
  disableNext,
  nextCursor,
  disablePrev,
  previousCursor,
}) {
  const { t } = useI18n();
  const router = useRouter();

  const handlePageChange = (cursor) => {
    if (!cursor) return;

    const params = new URLSearchParams(window.location.search);
    params.set("cursor", cursor);

    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 justify-center mt-8">
      <button
        onClick={() => handlePageChange(previousCursor)}
        disabled={disablePrev}
        className="px-4 py-2 bg-primary text-white hover:opacity-95 rounded-md text-sm cursor-pointer font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
      >
        {t.previous}
      </button>
      <button
        onClick={() => handlePageChange(nextCursor)}
        disabled={disableNext}
        className="px-4 py-2 bg-primary text-white hover:opacity-95 rounded-md text-sm cursor-pointer font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
      >
        {t.next}
      </button>
    </div>
  );
}
