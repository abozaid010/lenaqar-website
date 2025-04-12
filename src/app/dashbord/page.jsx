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
      <HomeDashbord users={initialClients.data} />

      <ClientsTable users={initialClients.data.users} />
    </>
  );
}
