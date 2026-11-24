import { SITE } from "@/config/site";
import {
  loadProjectSnapshot,
  projectLabels,
  projectsByCity,
} from "@/lib/lenaqar/projects.server";
import { catalogPlaceAr } from "@/lib/lenaqar/arabic-labels.server";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import ProjectsIndexContent from "@/components/lenaqar/projects-index-content";

const TITLE = "مشاريع المطورين في مصر — ملخص أسعار الوحدات";
const DESCRIPTION =
  "ملخص أسعار وحدات المطورين في مصر لكل مشروع: عدد الوحدات المسجلة، أقل وأعلى سعر، ووسيط سعر المتر. أسعار قوائم المطورين بتاريخها، مش أسعار بيع نهائية.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE.url}/projects`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
  },
  alternates: { canonical: `${SITE.url}/projects` },
  robots: { index: true, follow: true },
};

export default async function ProjectsIndexPage() {
  const snapshot = loadProjectSnapshot();
  const groups = await Promise.all(
    projectsByCity().map(async (group) => ({
      city: catalogPlaceAr(group.city) || group.city,
      units: group.units,
      projects: await Promise.all(
        group.projects.map(async (project) => {
          const labels = await projectLabels(project);
          return {
            slug: project.slug,
            name: labels.name,
            developer: labels.developer,
            district: labels.district,
            units: project.summary.units,
            priceMin: project.summary.priceMin,
          };
        }),
      ),
    })),
  );

  return (
    <>
      <BreadcrumbSchema
        items={[{ name: "مشاريع المطورين", url: `${SITE.url}/projects` }]}
      />
      <ProjectsIndexContent groups={groups} generatedAt={snapshot.generatedAt} />
    </>
  );
}
