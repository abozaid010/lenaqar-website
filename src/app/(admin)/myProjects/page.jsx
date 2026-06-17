import { cookies } from "next/headers";
import ProjectsList from "./_components/ProjectsList";
import { fetchProjectsPaginatedServer } from "@/lib/projects/project-api";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export const metadata = {
  title: "My Projects - Manage Real Estate Projects | LENAAI AI Sales Agent",
  description:
    "Manage your real estate projects, units, and payment plans, and track performance with LENAAI's Real Estate AI Sales Agent platform.",
  keywords: [
    "real estate projects",
    "project management",
    "property projects",
    "AI Sales Agent platform",
    "developers projects",
  ],
  openGraph: {
    title: "My Projects - LENAAI AI Sales Agent",
    description:
      "Manage your real estate projects with LENAAI's Real Estate AI Sales Agent platform.",
    url: `${SITE_URL}/myProjects`,
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/myProjects`,
  },
};

import { COOKIE_KEYS } from "@/constants/cookieKeys";

export default async function ProjectsPage() {
  const cookieStore = await cookies();
  const clientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value || null;

  const initialProjectsData = await fetchProjectsPaginatedServer(20);

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "My Projects",
            url: `${SITE_URL}/myProjects`,
          },
        ]}
      />
      <ProjectsList clientId={clientId} initialProjectsData={initialProjectsData} />
    </>
  );
}
