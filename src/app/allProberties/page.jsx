import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsPageQueryOptimized from "@/components/ui/units-page-query-optimized";
import { Suspense } from "react";

export default async function UnitsPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;

  return (
    <div className="container mb-4">
      <Suspense
        fallback={
          <LoadingSpinner
            message="Loading properties..."
            containerClassName="flex items-center justify-center h-96"
          />
        }
      >
        <UnitsPageQueryOptimized
          searchParams={searchParams}
          publicUnits={true}
        />
      </Suspense>
    </div>
  );
}
