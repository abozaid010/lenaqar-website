import LoadingSpinner from "@/components/ui/loading-spinner";
import PendingApprovalUnitsPageQuery from "@/components/ui/pending-approval-units-page-query";
import { Suspense } from "react";

import { SITE_URL } from "../../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export async function generateMetadata() {
  return {
    title: "Pending approval - Units | LENAAI AI Sales Agent",
    description:
      "View and manage property units pending approval. Same layout as Units with data from the pending approval API.",
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
            name: "Pending approval",
            url: `${SITE_URL}/units/pending-approval`,
          },
        ]}
      />
      <div className="container relative">
        <Suspense fallback={<LoadingSpinner />}>
          <PendingApprovalUnitsPageQuery searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
