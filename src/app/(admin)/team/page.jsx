import { getSalesData } from "@/components/services/serviceFetching";
import AddNewMember from "./_components/add-new-member";
import TeamTable from "./_components/team-table";
import Link from "next/link";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { cookies } from "next/headers";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";
import { canManageTeamFromToken } from "@/lib/getRoleFromToken";
import { safeCookieParse } from "@/utils/safeJsonParser";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const clientInfoCookie = cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value;
  const clientName = clientInfoCookie
    ? JSON.parse(clientInfoCookie)?.client_name
    : null;

  return {
    title: clientName
      ? `Team Management - ${clientName} | LENAAI AI Sales Agent`
      : "Team Management - LENAAI AI Sales Agent",
    description:
      "Manage your real estate sales team, assign team members, and track performance with LENAAI's Real Estate AI Sales Agent platform.",
    keywords: [
      "team management",
      "sales team",
      "real estate team",
      "AI Sales Agent team",
    ],
    openGraph: {
      title: "Team Management - LENAAI AI Sales Agent",
      description:
        "Manage your real estate sales team with LENAAI's Real Estate AI Sales Agent platform.",
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
  let data;
  let hasAccess = true;

  try {
    console.log("[Team Page] Starting to fetch sales data...");
    data = await getSalesData();
    
    console.log("[Team Page] API Response received:", {
      hasData: !!data,
      hasStatus: 'status' in (data || {}),
      hasDataProperty: !!data?.data,
      dataType: typeof data,
      dataKeys: data ? Object.keys(data) : [],
      isDataArray: Array.isArray(data?.data),
      dataLength: Array.isArray(data?.data) ? data.data.length : 'N/A',
    });
    
    if (!data?.status) {
      hasAccess = false;
      console.log("[Team Page] Access denied - status is false or missing");
    } else {
      console.log("[Team Page] Access granted - status is true");
    }
  } catch (error) {
    console.error("[Team Page] Error fetching sales data:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
    });
    hasAccess = false;
    data = { data: [], status: false };
  }

  // Safely extract team data with proper fallback
  const teamData = Array.isArray(data?.data) ? data.data : [];

  // Prefer JWT for role (tamper-proof). Fallback to cookie for UI only when JWT has no role (backend must enforce).
  let canManageTeam = await canManageTeamFromToken();
  if (!canManageTeam) {
    const cookieStore = await cookies();
    const clientInfo = safeCookieParse(cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value, {});
    const clientType = (clientInfo?.client_type ?? "").toLowerCase();
    canManageTeam = clientType === "admin" || clientType === "owner";
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
      <div className="h-full flex flex-col">
        {hasAccess ? (
          <>
            <div className="p-4 bg-white rounded-lg shadow-md">
              <div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:justify-between">
                <div className="flex-1" />
                <div className="w-full md:w-auto flex-shrink-0 flex gap-2 items-center">
                  <AddNewMember canManageTeam={canManageTeam} />
                  <div className="flex items-center justify-center w-10 h-10 bg-[#F6F7FB] border border-[#E6E6E6] rounded-md hover:border-primary/40 transition-colors">
                    <VideoInstructionsDialog
                      variant="team"
                      iconSize="sm"
                      tooltipText="How to manage team members"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 relative mt-4">
              <TeamTable data={teamData} canManageTeam={canManageTeam} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
            <p className="text-gray-600 mt-2">
              You do not have permission to view this page.
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
