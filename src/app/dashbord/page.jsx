import { fetchUsersData } from "@/components/services/serviceFetching";
import ClientsTable from "./_components/clients-table";
import DashbordFilter from "./_components/dashbord-filter";
import SearchBar from "./_components/client-search";

export const metadata = {
  title: "Dashbord",
  description: "Dashbord page",
};

export default async function DashbordPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams; // Ensure searchParams is awaited

  // TODO: Get initial clients based on the searchParams
  const initialClients = await fetchUsersData(searchParams);
  const hasMore = initialClients.data.pagination.has_more;
  const nextCursor =
    initialClients.data.pagination.next_cursor || parseInt(searchParams.cursor);

  console.log("initialClients", initialClients.data);

  return (
    <>
      <div className="bg-gray-50 min-h-screen p-2 sm:p-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-6">
          <DashbordFilter appliedFilters={searchParams} />

          <SearchBar q={searchParams.q} />

          <ClientsTable
            users={initialClients.data.users}
            disableNext={!hasMore}
            nextCursor={nextCursor}
          />
        </div>
      </div>
    </>
  );
}
