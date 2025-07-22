import LoadingSpinner from "@/components/ui/loading-spinner";
import UnitsFilter from "@/components/ui/units-filter";
import UnitsPageQueryOptimized from "@/components/ui/units-page-query-optimized";
import { cookies } from "next/headers";
import { Suspense } from "react";

export async function generateMetadata() {
  const cookieStore = await cookies();

  const clientName = cookieStore.get("client_info")?.value
    ? JSON.parse(cookieStore.get("client_info")?.value)?.client_name
    : null;

  return {
    title: clientName ? `LENAAI | ${clientName}` : "LENAAI",
    description: `LENAAI, your AI property consultant.`,
  };
}

export default async function UnitsPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;

  const cookieStore = await cookies();

  const clientId = cookieStore.get("lena-website-client_id")?.value || "";

  return (
    <div className="container relative">
      <UnitsFilter
        appliedFilters={searchParams}
        clientId={clientId}
        readonly={false}
      />

      <Suspense
        fallback={
          <LoadingSpinner containerClassName="flex items-center justify-center h-96" />
        }
      >
        <UnitsPageQueryOptimized
          searchParams={searchParams}
          clientId={clientId}
        />
      </Suspense>
    </div>
  );
}
