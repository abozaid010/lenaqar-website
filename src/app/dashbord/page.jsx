import HomeDashbord from "@/components/dashbord/pages/HomeDashbord";
import { fetchUsersData } from "@/components/services/serviceFetching";

export const metadata = {
  title: "Dashbord",
  description: "Dashbord page",
};

export default async function DashbordPage({ searchParams }) {
  // TODO: Get initial clients based on the searchParams
  const users = await fetchUsersData();

  console.log("users", searchParams);
  return (
    <>
      <HomeDashbord users={users.data} />
    </>
  );
}
