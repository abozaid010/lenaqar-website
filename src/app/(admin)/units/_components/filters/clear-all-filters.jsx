"use client";

import { useRouter } from "next/navigation";

export default function ClearAllFilters() {
  const router = useRouter();

  const handleClearAll = () => {
    router.push(`${window.location.pathname}`);
  };

  return (
    <button
      className="text-sm text-primary hover:text-blue-800 font-medium"
      onClick={handleClearAll}
    >
      Clear all filters
    </button>
  );
}
