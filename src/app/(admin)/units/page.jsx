import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsFilter from "@/components/ui/units-filter";
import UnitsPageQueryOptimized from "@/components/ui/units-page-query-optimized";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export async function generateMetadata() {
  const cookieStore = await cookies();

  const clientName = cookieStore.get("client_info")?.value
    ? JSON.parse(cookieStore.get("client_info")?.value)?.client_name
    : null;

  return {
    title: clientName
      ? `Units - ${clientName} | LENAAI AI CRM`
      : "Units - LENAAI AI CRM",
    description:
      "Manage and view all property units. Filter, search, and organize your real estate inventory with LENAAI's AI-powered CRM platform.",
    keywords: [
      "property units",
      "real estate inventory",
      "unit management",
      "AI CRM",
      "property listings",
    ],
    openGraph: {
      title: "Units - LENAAI AI CRM",
      description:
        "Manage and view all property units with LENAAI's AI-powered CRM.",
      url: `${SITE_URL}/units`,
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}/units`,
    },
  };
}

export default async function UnitsPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;

  const cookieStore = await cookies();

  const clientId = cookieStore.get("lena-website-client_id")?.value || "";

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Units",
            url: `${SITE_URL}/units`,
          },
        ]}
      />
      <div className="container relative">
      <UnitsFilter
        appliedFilters={searchParams}
        clientId={clientId}
        isPublic={false}
      />

      <Suspense fallback={<LoadingSpinner />}>
        <UnitsPageQueryOptimized
          searchParams={searchParams}
          clientId={clientId}
        />
      </Suspense>
    </div>
    </>
  );
}
