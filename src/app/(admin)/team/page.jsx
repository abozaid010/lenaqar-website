import { getSalesData } from "@/components/services/serviceFetching";
import AddNewMember from "./_components/add-new-member";
import { getClientid } from "@/components/services/clientCookies";
import TeamTable from "./_components/team-table";
import Link from "next/link";

export default async function TeamPage() {
  const clientId = await getClientid();
  const data = await getSalesData();

  let hasAccess = true;
  if (!data?.status) {
    hasAccess = false;
  }

  return (
    <div className="container mx-auto">
      {hasAccess ? (
        <>
          <AddNewMember clientId={clientId} />

          <TeamTable data={data.data} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            You do not have permission to view this chat.
          </p>
          <Link
            href="/dashboard"
            className="underline text-sm text-blue-700 mt-4"
          >
            Go Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
