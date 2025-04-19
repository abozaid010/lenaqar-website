"use client";

import { useRouter } from "next/navigation";

export default function ClientsTablePagination({
  disableNext,
  nextCursor,
  disablePrev,
  previousCursor,
}) {
  const router = useRouter();

  const handlePageChange = (cursor) => {
    console.log("cursor", cursor);
    if (!cursor) return;

    const params = new URLSearchParams(window.location.search);
    params.set("cursor", cursor);

    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-1">
      <button
        onClick={() => handlePageChange(previousCursor)}
        disabled={disablePrev}
        className="px-4 py-1 bg-[#1e3a8a] text-white hover:opacity-95 rounded-md text-sm cursor-pointer font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
      >
        Previous
      </button>
      <button
        onClick={() => handlePageChange(nextCursor)}
        disabled={disableNext}
        className="px-4 py-1 bg-[#1e3a8a] text-white hover:opacity-95 rounded-md text-sm cursor-pointer font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
      >
        Next
      </button>
    </div>
  );
}
