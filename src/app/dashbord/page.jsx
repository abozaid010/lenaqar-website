import HomeDashbord from "@/components/dashbord/pages/HomeDashbord";
import { fetchUsersData } from "@/components/services/serviceFetching";
import ClientsTable from "./_components/clients-table";

export const metadata = {
  title: "Dashbord",
  description: "Dashbord page",
};

export default async function DashbordPage({ searchParams }) {
  const page = parseInt(searchParams.page) || 1;

  // TODO: Get initial clients based on the searchParams
  const initialClients = await fetchUsersData();
  const hasMore = initialClients.data.pagination.has_more;

  return (
    <>
      <div className="bg-gray-50 min-h-screen p-2 sm:p-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-6">
          <ClientsTable
            users={initialClients.data.users}
            disableNext={!hasMore}
            currentPage={page}
          />
        </div>
      </div>
      {/* <HomeDashbord users={initialClients.data} /> */}
    </>
  );
}
