"use client";

import { useAverageScore } from "@/context/average-score";
import { useUsersData } from "@/hooks/use-users-data";
import { Loader2, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import ClientsTable from "./clients-table";

export default function ClientsListQuery({ searchParams }) {
  const { setAverageScore } = useAverageScore();

  const {
    data: usersData,
    isLoading,
    error,
    isError,
    refetch,
    isFetching,
  } = useUsersData(JSON.stringify(searchParams));

  const users = usersData?.data?.users || [];

  useEffect(() => {
    if (users.length > 0) {
      const totalScore = users.reduce(
        (sum, user) => sum + (user.score || 0),
        0
      );
      const averageScore = totalScore / users.length;
      setAverageScore(averageScore);
    } else {
      setAverageScore(null);
    }
  }, [users]);

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
            {error?.message || "An unexpected error occurred"}
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

  return <ClientsTable users={users} />;
}
