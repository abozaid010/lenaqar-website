import { cookies } from "next/headers";
import ProjectsList from "./_components/ProjectsList";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export const metadata = {
  title: "My Projects - Manage Real Estate Projects | LENAAI AI CRM",
  description:
    "Manage your real estate projects, view project details, units, payment plans, and track project performance on LENAAI's AI-powered CRM platform.",
  keywords: [
    "real estate projects",
    "project management",
    "property projects",
    "AI CRM",
    "developers projects",
  ],
  openGraph: {
    title: "My Projects - LENAAI AI CRM",
    description:
      "Manage your real estate projects with LENAAI's AI-powered CRM platform.",
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

export default async function ProjectsPage() {
  const cookieStore = await cookies();
  const clientId = cookieStore.get("lena-website-client_id")?.value || null;

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
      <ProjectsList clientId={clientId} />
    </>
  );
}
