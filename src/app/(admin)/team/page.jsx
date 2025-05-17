import { getSalesData } from "@/components/services/serviceFetching";
import AddNewMember from "./_components/add-new-member";
import { getClientid } from "@/components/services/clientCookies";

export default async function TeamPage() {
  const clientId = await getClientid();
  const data = await getSalesData();

  console.log("Client ID:", clientId);
  console.log("Sales Data:", data);

  return (
    <div className="container mx-auto">
      <AddNewMember clientId={clientId} />

      <div className="border border-gray-200 sm:rounded-lg scroll-snap-x-mandatory ">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100"></thead>

          <tbody className="bg-white divide-y divide-gray-200"></tbody>
        </table>
      </div>
    </div>
  );
}
