import LoadingSpinner from "@/components/ui/loading-spinner";
import PendingApprovalPageClient from "./pending-approval-page-client";
import { Suspense } from "react";
import { cookies } from "next/headers";

import { SITE_URL } from "../../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { fetchPendingApprovalUnitsServer } from "@/lib/units/unit-api";

export async function generateMetadata() {
  return {
    title: "Hidden units - Units | LENAAI AI Sales Agent",
    description:
      "View and manage hidden property units. Same layout as Units with data from the pending approval API.",
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

  const cookieStore = await cookies();
  const clientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value || "";

  const initialUnitsData = await fetchPendingApprovalUnitsServer(
    searchParams,
    clientId
  );

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Units", url: `${SITE_URL}/units` },
          {
            name: "Hidden units",
            url: `${SITE_URL}/units/pending-approval`,
          },
        ]}
      />
      <div className="h-full flex flex-col">
        <Suspense fallback={<LoadingSpinner />}>
          <PendingApprovalPageClient
            searchParams={searchParams}
            clientId={clientId}
            initialUnitsData={initialUnitsData}
          />
        </Suspense>
      </div>
    </>
  );
}
