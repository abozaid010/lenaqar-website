import { Suspense } from "react";
import ClientsListQuery from "./_components/clients-list-query";
import DashbordFilter from "./_components/dashbord-filter";

import LoadingSpinner from "@/components/ui/loading-spinner";
import { AverageScoreProvider } from "@/context/average-score";
import { cookies } from "next/headers";
import PremiumFeatures from "./_components/premuim-features";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";

import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const clientName = cookieStore.get("client_info")?.value
    ? JSON.parse(cookieStore.get("client_info")?.value)?.client_name
    : null;

  return {
    title: clientName
      ? `Dashboard - ${clientName} | LENAAI AI CRM`
      : "Dashboard - LENAAI AI CRM",
    description:
      "Manage your real estate clients, leads, and sales pipeline with LENAAI's AI-powered CRM dashboard. Track client scores and automate follow-ups.",
    keywords: [
      "CRM dashboard",
      "real estate CRM",
      "AI CRM",
      "client management",
      "lead scoring",
      "AI Sales Agent",
      "sales pipeline",
    ],
    openGraph: {
      title: "Dashboard - LENAAI AI CRM",
      description:
        "Manage your real estate clients and sales pipeline with LENAAI's AI-powered CRM dashboard.",
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
      <div className="bg-gray-50 min-h-screen ">
      <div className="container my-3 no-print !px-0">
        <PremiumFeatures />
      </div>

      <div className="container bg-white rounded-md shadow-sm py-4 md:py-6">
        <AverageScoreProvider>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <DashbordFilter appliedFilters={searchParams} />
            </div>
          </div>

          {/* <SearchBar q={searchParams.query} /> */}

          <Suspense fallback={<LoadingSpinner />}>
            <ClientsListQuery searchParams={searchParams} />
          </Suspense>
        </AverageScoreProvider>
      </div>
    </div>
    </>
  );
}
