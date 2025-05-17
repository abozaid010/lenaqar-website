import AddNewMember from "./_components/add-new-member";
import { getClientId } from "@/lib/auth";

export default async function TeamPage() {
  const clientId = await getClientId();

  return (
    <div className="container mx-auto">
      <AddNewMember />

      <div className="border border-gray-200 sm:rounded-lg scroll-snap-x-mandatory ">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100"></thead>

          <tbody className="bg-white divide-y divide-gray-200"></tbody>
        </table>
      </div>
    </div>
  );
}
