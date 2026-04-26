"use client";

import { Suspense } from "react";

/**
 * Wrapper component to handle Next.js 16+ searchParams Promise
 * Use this to wrap components that use useSearchParams()
 */
export function SearchParamsWrapper({ children }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    }>
      {children}
    </Suspense>
  );
}
