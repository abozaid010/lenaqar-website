import LoadingSpinner from "@/components/ui/loading-spinner";
import ResalePageQuery from "@/components/ui/resale_page_query";
import { Suspense } from "react";

import { SITE_URL } from "../../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export async function generateMetadata() {
  return {
    title: "Resale - Units | LENAAI AI Sales Agent",
    description:
      "View and manage resale property units. Same layout as Units with data from the resale (pending approval) API.",
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}/units/pending-approval`,
    },
  };
}

export default async function PendingApprovalUnitsPage({
  searchParams: rawSearchParams,
}) {
  const searchParams = await rawSearchParams;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Units", url: `${SITE_URL}/units` },
          {
            name: "Resale",
            url: `${SITE_URL}/units/pending-approval`,
          },
        ]}
      />
      <div className="container relative">
        <Suspense fallback={<LoadingSpinner />}>
          <ResalePageQuery searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
