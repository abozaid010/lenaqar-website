"use client";

import { useRouter } from "next/navigation";

export default function ClientsTablePagination({ disableNext, nextCursor }) {
  const router = useRouter();

  const handlePageChange = (newPage = 1) => {
    const params = new URLSearchParams(window.location.search);
    params.set("cursor", newPage);

    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="flex justify-end items-center mt-4">
      <div className="flex gap-2">
        <button
          // TODO: Implement previous page logic
          disabled={true}
          className="px-4 py-2 bg-[#1e3a8a] text-white hover:opacity-95 rounded-md text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
        >
          Previous
        </button>
        <button
          onClick={() => handlePageChange(nextCursor)}
          disabled={disableNext}
          className="px-4 py-2 bg-[#1e3a8a] text-white hover:opacity-95 rounded-md text-sm  font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-auto"
        >
          Next
        </button>
      </div>
    </div>
  );
}
