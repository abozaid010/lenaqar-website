import { getSalesData } from "@/components/services/serviceFetching";
import AddNewMember from "./_components/add-new-member";
import { getClientid } from "@/components/services/clientCookies";
import TeamTable from "./_components/team-table";

export default async function TeamPage() {
  const clientId = await getClientid();
  const data = await getSalesData();

  return (
    <div className="container mx-auto">
      <AddNewMember clientId={clientId} />

      <TeamTable data={data.data} />
    </div>
  );
}
