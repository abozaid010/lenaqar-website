import { getSalesData } from "@/components/services/serviceFetching";
import AddNewMember from "./_components/add-new-member";
import TeamTable from "./_components/team-table";
import Link from "next/link";
import { cookies } from "next/headers";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";
export async function generateMetadata() {
  const cookieStore = await cookies();
  const clientInfoCookie = cookieStore.get("client_info")?.value;
  const clientName = clientInfoCookie
    ? JSON.parse(clientInfoCookie)?.client_name
    : null;

  return {
    title: clientName ? `LENAAI | ${clientName}` : "LENAAI",
    description: `LENAAI, your AI property consultant.`,
  };
}
export default async function TeamPage() {
  const data = await getSalesData();

  let hasAccess = true;
  if (!data?.status) {
    hasAccess = false;
  }

  return (
    <div className="container mx-auto h-full">
      {hasAccess ? (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between gap-4">
            <AddNewMember />
            {data && data.data && data.data.length > 0 && (
              <VideoInstructionsDialog
                variant="team"
                iconSize="md"
                tooltipText="How to manage team members"
              />
            )}
          </div>

          <div className="flex-1 relative">
            <TeamTable data={data.data} />
          </div>
        </div>
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
