import { notFound } from "next/navigation";
import { SITE } from "@/config/site";
import {
  getPublicProject,
  getPublicProjects,
  loadProjectSnapshot,
  projectLabels,
  relatedProjects,
} from "@/lib/lenaqar/projects.server";
import { projectMetaText } from "@/lib/lenaqar/project-summary";
import { getIndexableGuideLinks } from "@/lib/guides/load";
import { areaGuideHrefsForUnit } from "@/lib/guides/area-guides";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import ProjectSchema from "@/components/schema/ProjectSchema";
import ProjectDetailContent from "@/components/lenaqar/project-detail-content";

// Pages come from the committed snapshot only; an unknown slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getPublicProjects().map((project) => ({ slug: project.slug }));
}

const BUYING_GUIDES = [
  "/guides/buying/check-developer-project",
  "/guides/buying/resale-vs-new-launch",
  "/guides/buying/payment-plans-vs-cash",
];

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = getPublicProject(slug);
  if (!project) return { title: "المشروع غير متاح", robots: { index: false, follow: true } };
  const labels = await projectLabels(project);
  const { title, description } = projectMetaText(project, labels);
  const url = `${SITE.url}/projects/${project.slug}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      locale: "ar_EG",
      siteName: SITE.name,
      type: "website",
    },
    alternates: { canonical: url },
    robots: { index: true, follow: true },
  };
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const project = getPublicProject(slug);
  if (!project) notFound();

  const labels = await projectLabels(project);
  const { title, description } = projectMetaText(project, labels);
  const url = `${SITE.url}/projects/${project.slug}`;
  const related = relatedProjects(project).map((other) => ({
    slug: other.slug,
    name: other.nameAr || other.nameEn,
  }));
  const guideLinks = getIndexableGuideLinks([
    ...areaGuideHrefsForUnit(project),
    ...BUYING_GUIDES,
  ]);

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "مشاريع المطورين", url: `${SITE.url}/projects` },
          { name: labels.name, url },
        ]}
      />
      <ProjectSchema
        project={project}
        labels={labels}
        url={url}
        title={title}
        description={description}
      />
      <ProjectDetailContent
        project={project}
        labels={labels}
        generatedAt={loadProjectSnapshot().generatedAt}
        related={related}
        guideLinks={guideLinks}
      />
    </>
  );
}
