import { fetchUsersData } from "@/components/services/serviceFetching";
import ClientsTable from "./_components/clients-table";
import DashbordFilter from "./_components/dashbord-filter";
import SearchBar from "./_components/client-search";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { cookies } from "next/headers";
import PremiumFeatures from "./_components/premuim-features";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const clientName = JSON.parse(
    cookieStore.get("client_info")?.value
  )?.client_name;

  return {
    title: clientName ? `Dashboard | ${clientName}` : "LENAAI",
    description: `LENAAI, your AI property consultant.`,
  };
}

export default async function DashbordPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;
  return (
    <div className="bg-gray-50 min-h-screen ">
      <div className="container mx-auto my-3 no-print !px-0">
        <PremiumFeatures />
      </div>

      <div className="container mx-auto bg-white rounded-md shadow-sm md:py-6">
        <DashbordFilter appliedFilters={searchParams} />

        <SearchBar q={searchParams.query} />

        <Suspense
          key={JSON.stringify(searchParams)}
          fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2
                size={70}
                className="text-center animate-spin text-primary"
              />
            </div>
          }
        >
          <ClientsList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function ClientsList({ searchParams }) {
  const res = await fetchUsersData(JSON.stringify(searchParams));
  const initialData = res?.data?.users;
  const hasMoreNext = initialData?.pagination?.has_more_next;
  const hasMorePrev = initialData?.pagination?.has_more_prev;

  const nextCursor = initialData?.pagination?.next_cursor;
  const previousCursor = initialData?.pagination?.prev_cursor;

  return (
    <ClientsTable
      users={initialData}
      disableNext={!hasMoreNext}
      disablePrev={!hasMorePrev}
      nextCursor={nextCursor}
      previousCursor={previousCursor}
    />
  );
}
