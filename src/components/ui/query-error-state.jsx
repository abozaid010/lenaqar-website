"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Reusable Query Error State Component
 * 
 * Displays a user-friendly error message with retry functionality
 * for TanStack Query errors. Can be used across all tabs/components.
 * 
 * @param {Object} props
 * @param {Error} props.error - The error object from TanStack Query
 * @param {Function} props.refetch - Function to retry the query
 * @param {boolean} props.isFetching - Whether the query is currently fetching
 * @param {string} props.title - Custom error title (optional)
 * @param {string} props.message - Custom error message (optional)
 * @param {string} props.retryLabel - Custom retry button label (optional)
 * @param {string} props.className - Additional CSS classes (optional)
 */
export default function QueryErrorState({
  error,
  refetch,
  isFetching = false,
  title,
  message,
  retryLabel = "Retry",
  className = "",
}) {
  const defaultTitle = title || "Error loading data";
  const defaultMessage =
    message ||
    error?.message ||
    "An unexpected error occurred while fetching data. Please try again.";

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[400px] p-8 bg-gray-50 rounded-lg ${className}`}
    >
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        {defaultTitle}
      </h2>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {defaultMessage}
      </p>
      {refetch && (
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:opacity-95 disabled:opacity-50 transition-opacity"
        >
          <RotateCcw
            size={16}
            className={isFetching ? "animate-spin" : ""}
          />
          {isFetching ? "Retrying..." : retryLabel}
        </button>
      )}
    </div>
  );
}

