"use client";

import { useEffect, useState } from "react";
import { getSalesData } from "@/components/services/serviceFetching";
import AddNewMember from "./add-new-member";
import TeamTable from "./team-table";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";
import Link from "next/link";

export default function TeamContent({ canManageTeam = true }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const result = await getSalesData();
        if (!mounted) return;

        if (!result?.status) {
          setHasAccess(false);
        } else {
          setHasAccess(true);
          setData(Array.isArray(result?.data) ? result.data : []);
        }
      } catch (error) {
        if (!mounted) return;
        setHasAccess(false);
        setData([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:justify-between">
            <div className="flex-1" />
            <div className="w-full md:w-auto flex-shrink-0 flex gap-2 items-center">
              <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-10 w-10 bg-gray-200 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex-1 relative mt-4">
          <div className="border border-gray-200 sm:rounded-lg mt-6">
            <div className="bg-gray-100 h-12 animate-pulse" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-white border-b border-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
        <p className="text-gray-600 mt-2">
          You do not have permission to view this page.
        </p>
        <Link
          href="/dashboard"
          className="underline text-sm text-blue-700 mt-4"
        >
          Go Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:justify-between">
          <div className="flex-1" />
          <div className="w-full md:w-auto flex-shrink-0 flex gap-2 items-center">
            <AddNewMember canManageTeam={canManageTeam} />
            <div className="flex items-center justify-center w-10 h-10 bg-[#F6F7FB] border border-[#E6E6E6] rounded-md hover:border-primary/40 transition-colors">
              <VideoInstructionsDialog
                variant="team"
                iconSize="sm"
                tooltipText="How to manage team members"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative mt-4">
        <TeamTable data={data} canManageTeam={canManageTeam} />
      </div>
    </>
  );
}
