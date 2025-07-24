import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsFilter from "@/components/ui/units-filter";
import UnitsPageQueryOptimized from "@/components/ui/units-page-query-optimized";
import { cookies } from "next/headers";
import { Suspense } from "react";

export default async function UnitsPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;
  const cookieStore = await cookies();

  const clientId = cookieStore.get("lena-website-client_id")?.value || "";

  return (
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
  );
}
