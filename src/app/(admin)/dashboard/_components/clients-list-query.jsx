"use client";

import { useUsersData } from "@/hooks/use-users-data";
import { Loader2, RotateCcw } from "lucide-react";
import ClientsTable from "./clients-table";

export default function ClientsListQuery({ searchParams }) {
  const {
    data: usersData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useUsersData(JSON.stringify(searchParams));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={70} className="text-center animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">
            Error loading clients
          </div>
          <div className="text-gray-600 text-sm mb-4">
            An unexpected error occurred
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-95 disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            <RotateCcw size={16} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? "Retrying..." : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  const users = usersData?.data?.users || [];

  return (
    <div className="relative">
      {isFetching && !isLoading && (
        <div className="absolute top-0 right-0 z-10">
          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-sm">
            <Loader2 size={14} className="animate-spin" />
            Updating...
          </div>
        </div>
      )}

      <ClientsTable users={users} />
    </div>
  );
}
