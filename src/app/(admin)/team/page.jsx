import { getSalesData } from "@/components/services/serviceFetching";
import AddNewMember from "./_components/add-new-member";
import TeamTable from "./_components/team-table";
import Link from "next/link";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
// ...
export async function generateMetadata() {
  const cookieStore = await cookies();
  const clientInfoCookie = cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value;
  const clientName = clientInfoCookie
    ? JSON.parse(clientInfoCookie)?.client_name
    : null;

  return {
    title: clientName
      ? `Team Management - ${clientName} | LENAAI AI CRM`
      : "Team Management - LENAAI AI CRM",
    description:
      "Manage your real estate sales team, assign team members, and track performance with LENAAI's AI-powered CRM platform.",
    keywords: [
      "team management",
      "sales team",
      "real estate team",
      "AI CRM team",
    ],
    openGraph: {
      title: "Team Management - LENAAI AI CRM",
      description:
        "Manage your real estate sales team with LENAAI's AI-powered CRM.",
      url: `${SITE_URL}/team`,
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}/team`,
    },
  };
}
export default async function TeamPage() {
  const data = await getSalesData();

  let hasAccess = true;
  if (!data?.status) {
    hasAccess = false;
  }

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Team",
            url: `${SITE_URL}/team`,
          },
        ]}
      />
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
    </>
  );
}
