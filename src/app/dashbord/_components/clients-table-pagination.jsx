"use client";

import { useRouter } from "next/navigation";

export default function ClientsTablePagination({
  disableNext,
  nextCursor = null,
}) {
  const router = useRouter();

  const handlePageChange = () => {
    if (!nextCursor) return;

    const params = new URLSearchParams(window.location.search);
    params.set("cursor", nextCursor);

    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-1">
      <button
        // TODO: Implement previous page logic
        disabled={true}
        className="px-4 py-1 bg-[#1e3a8a] text-white hover:opacity-95 rounded-md text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
      >
        Previous
      </button>
      <button
        onClick={handlePageChange}
        disabled={disableNext || !nextCursor}
        className="px-4 py-1 bg-[#1e3a8a] text-white hover:opacity-95 rounded-md text-sm cursor-pointer font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
      >
        Next
      </button>
    </div>
  );
}
