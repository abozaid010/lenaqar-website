import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsFilter from "@/components/ui/units-filter";
import UnitsPageQueryOptimized from "@/components/ui/units-page-query-optimized";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { SITE_URL } from "../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export const metadata = {
  title: "All Properties - AI-Powered Real Estate Listings | LENAAI",
  description:
    "Browse real estate properties in Egypt. AI Sales Agent helps you find apartments, villas, and commercial units with detailed information and pricing.",
  keywords: [
    "real estate listings",
    "properties Egypt",
    "apartments for sale",
    "villas Egypt",
    "commercial properties",
    "property search",
  ],
  openGraph: {
    title: "All Properties | LENAAI",
    description:
      "Browse our comprehensive collection of real estate properties in Egypt. Find apartments, villas, and commercial units.",
    url: `${SITE_URL}/allProberties`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "All Properties | LENAAI",
    description: "Browse real estate properties in Egypt",
  },
  alternates: {
    canonical: `${SITE_URL}/allProberties`,
  },
};

export default async function UnitsPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;
  const cookieStore = await cookies();

  const clientId = cookieStore.get("lena-website-client_id")?.value || "";

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "All Properties",
            url: `${SITE_URL}/allProberties`,
          },
        ]}
      />
      <div className="container mb-4">
      <UnitsFilter
        appliedFilters={searchParams}
        clientId={clientId}
        isPublic={true}
      />

      <Suspense fallback={<LoadingSpinner message="Loading properties..." />}>
        <UnitsPageQueryOptimized
          searchParams={searchParams}
          publicUnits={true}
        />
      </Suspense>
    </div>
    </>
  );
}
