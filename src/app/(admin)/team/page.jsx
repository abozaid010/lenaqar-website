import TeamContent from "./_components/team-content";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { cookies } from "next/headers";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
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
  // Fast permission check only - no blocking data fetching
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
        <TeamContent canManageTeam={canManageTeam} />
      </div>
    </>
  );
}
