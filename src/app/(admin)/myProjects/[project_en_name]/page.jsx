import { cookies } from "next/headers";
import { SITE_URL } from "../../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { getProjectByEnName } from "@/lib/projects/project-api";
import { transformProjectToViewModel } from "@/lib/projects/project-api";
import ProjectDetailsPage from "@/components/project-details/project-details-page";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getServerTranslations } from "@/utils/getServerTranslations";

export async function generateMetadata({ params }) {
  const { project_en_name } = await params;
  
  try {
    const response = await getProjectByEnName(project_en_name);
    const project = response?.data?.project
      ? transformProjectToViewModel(response.data.project)
      : null;

    const title = project?.title
      ? `${project.title} - Project Details | LENAAI AI Sales Agent`
      : "Project Details - AI Sales Agent | LENAAI";
    
    const description = project
      ? `${project.title} - ${project.locationLabel}. View detailed project information including specifications, pricing, amenities, and available units. LENAAI's AI Sales Agent provides comprehensive project insights.`
      : "View detailed project information including specifications, pricing, amenities, and availability. LENAAI's AI Sales Agent helps with project inquiries and recommendations.";

    return {
      title,
      description,
      keywords: [
        "project details",
        "real estate project",
        "property development",
        "project specifications",
        "amenities",
        "pricing",
        project?.locationLabel,
        project?.developerName,
      ].filter(Boolean),
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/myProjects/${project_en_name}`,
        type: "website",
        ...(project?.heroImages?.[0] && {
          images: [
            {
              url: project.heroImages[0].url,
              width: 1200,
              height: 630,
              alt: project.heroImages[0].alt,
            },
          ],
        }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(project?.heroImages?.[0] && {
          images: [project.heroImages[0].url],
        }),
      },
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        canonical: `${SITE_URL}/myProjects/${project_en_name}`,
      },
    };
  } catch (error) {
    console.error("Error generating project metadata:", error?.message ?? error);
    return {
      title: "Project Details - AI Sales Agent | LENAAI",
      description: "View detailed project information with LENAAI's AI Sales Agent.",
    };
  }
}

export default async function ProjectDetailsPageWrapper({ params }) {
  const { project_en_name } = await params;

  try {
    const response = await getProjectByEnName(project_en_name);
    
    if (!response?.status || !response.data?.project) {
      return (
        <div className="container mx-auto h-full flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4 max-w-md">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-800">Project Not Found</h1>
              <p className="text-gray-600">
                The project "{project_en_name}" could not be found or may have been removed.
              </p>
            </div>
            <a
              href="/myProjects"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Projects
            </a>
          </div>
        </div>
      );
    }

    const cookieStore = await cookies();
    const clientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value;
    const locale = cookieStore.get('lang')?.value || 'ar';
    const { t } = await getServerTranslations(locale);

    const project = {
      ...transformProjectToViewModel(response.data.project, t, locale),
      ...(clientId ? { clientId } : {}),
    };

    return (
      <>
        <BreadcrumbSchema
          items={[
            {
              name: "Dashboard",
              url: `${SITE_URL}/dashboard`,
            },
            {
              name: "My Projects",
              url: `${SITE_URL}/myProjects`,
            },
            {
              name: project.title,
              url: `${SITE_URL}/myProjects/${project_en_name}`,
            },
          ]}
        />
        <ProjectDetailsPage project={project} rawProject={response.data.project} />
      </>
    );
  } catch (error) {
    console.error("Error loading project:", error?.message ?? error);
    
    return (
      <div className="container mx-auto h-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-red-600">Error Loading Project</h1>
            <p className="text-gray-600">
              We encountered an error while loading this project. Please try again later.
            </p>
          </div>
          <a
            href="/myProjects"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Projects
          </a>
        </div>
      </div>
    );
  }
}
