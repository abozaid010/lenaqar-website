import { fetchUsersData } from "@/components/services/serviceFetching";
import ClientsTable from "./_components/clients-table";
import DashbordFilter from "./_components/dashbord-filter";
import SearchBar from "./_components/client-search";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Dashbord",
  description: "Dashbord page",
};

export default async function DashbordPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;
  return (
    <div className="bg-gray-50 min-h-screen p-2 sm:p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-6">
        <DashbordFilter appliedFilters={searchParams} />

        <SearchBar q={searchParams.query} />

        <Suspense
          key={JSON.stringify(searchParams)}
          fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2
                size={70}
                className="text-center animate-spin text-[#1e3a8a]"
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

  const initialData = res.data.data;
  const hasMoreNext = initialData.pagination.has_more_next;
  const hasMorePrev = initialData.pagination.has_more_prev;

  const nextCursor = initialData.pagination.next_cursor;
  const previousCursor = initialData.pagination.prev_cursor;

  console.log("initialClients", initialData);
  return (
    <ClientsTable
      users={initialData.users}
      disableNext={!hasMoreNext}
      disablePrev={!hasMorePrev}
      nextCursor={nextCursor}
      previousCursor={previousCursor}
    />
  );
}
