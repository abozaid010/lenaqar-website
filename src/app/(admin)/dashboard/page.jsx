import { Suspense } from "react";
import ClientsListQuery from "./_components/clients-list-query";
import DashbordFilter from "./_components/dashbord-filter";

import LoadingSpinner from "@/components/ui/loading-spinner";
import { AverageScoreProvider } from "@/context/average-score";
import { cookies } from "next/headers";
import PremiumFeatures from "./_components/premuim-features";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const clientName = cookieStore.get("client_info")?.value
    ? JSON.parse(cookieStore.get("client_info")?.value)?.client_name
    : null;

  return {
    title: clientName ? `LENAAI | ${clientName}` : "LENAAI",
    description: `LENAAI, your AI property consultant.`,
  };
}

export default async function DashbordPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;

  return (
    <div className="bg-gray-50 min-h-screen ">
      <div className="container my-3 no-print !px-0">
        <PremiumFeatures />
      </div>

      <div className="container bg-white rounded-md shadow-sm py-4 md:py-6">
        <AverageScoreProvider>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <DashbordFilter appliedFilters={searchParams} />
            </div>
            <VideoInstructionsDialog
              variant="analytics"
              iconSize="md"
              tooltipText="How to use analytics"
            />
          </div>

          {/* <SearchBar q={searchParams.query} /> */}

          <Suspense fallback={<LoadingSpinner />}>
            <ClientsListQuery searchParams={searchParams} />
          </Suspense>
        </AverageScoreProvider>
      </div>
    </div>
  );
}
