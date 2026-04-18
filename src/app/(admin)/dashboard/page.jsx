import { Suspense } from "react";
import DashbordFilter from "./_components/dashbord-filter";
import DashboardSplitView from "./_components/split-view/DashboardSplitView";

import LoadingSpinner from "@/components/ui/loading-spinner";
import { AverageScoreProvider } from "@/context/average-score";
import { cookies } from "next/headers";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { SELECTION_COLORS } from "@/constants/colors";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const clientName = cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value
    ? JSON.parse(cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value)?.client_name
    : null;

  return {
    title: clientName
      ? `Dashboard - ${clientName} | LENAAI AI Sales Agent`
      : "Dashboard - LENAAI AI Sales Agent",
    description:
      "Manage real estate leads, clients, and sales pipeline with LENAAI's Real Estate AI Sales Agent dashboard. Track client scores and automate follow-ups.",
    keywords: [
      "AI Sales Agent dashboard",
      "real estate sales agent dashboard",
      "lead management dashboard",
      "client management",
      "lead scoring",
      "AI Sales Agent",
      "sales pipeline",
    ],
    openGraph: {
      title: "Dashboard - LENAAI AI Sales Agent",
      description:
        "Manage real estate clients and sales pipeline with LENAAI's Real Estate AI Sales Agent dashboard.",
      url: `${SITE_URL}/dashboard`,
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}/dashboard`,
    },
  };
}

export default async function DashbordPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Dashboard",
            url: `${SITE_URL}/dashboard`,
          },
        ]}
      />
      <div className={`min-h-0 flex flex-col flex-1 ${SELECTION_COLORS.BG}`}>
        <div className="container bg-white rounded-md shadow-sm py-2 flex flex-col min-h-[calc(100vh-5.5rem)] md:min-h-[calc(100vh-6rem)]">
          <AverageScoreProvider>
            <div className="flex items-center justify-between shrink-0 mb-1 gap-2">
              <div className="flex flex-1 min-w-0 items-center">
                <DashbordFilter appliedFilters={searchParams} compact />
              </div>
            </div>

            <Suspense
              fallback={
                <LoadingSpinner
                  message="Loading leads..."
                  containerClassName="flex items-center justify-center min-h-[400px]"
                />
              }
            >
              <DashboardSplitView />
            </Suspense>
          </AverageScoreProvider>
        </div>
      </div>
    </>
  );
}
