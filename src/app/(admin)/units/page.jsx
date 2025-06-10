import {
  fetchCitisAndProjects,
  fetchcombounds,
  fetchDevelopers,
  fetchUnitsFilter,
} from "@/components/services/serviceFetching";
import UnitsGrid from "@/components/ui/units-grid";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import UnitsFilter from "@/components/ui/units-filter";
import { cookies } from "next/headers";

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
  const clientId = cookieStore.get("lena-website-client_id")?.value;
  const clientName = cookieStore.get("client_info")?.value
    ? JSON.parse(cookieStore.get("client_info")?.value)?.client_name
    : null;

  const [developers, compounds, citiesAndDistricts] = await Promise.all([
    fetchDevelopers(),
    fetchcombounds(true),
    fetchCitisAndProjects(),
  ]);

  return (
    <div className="w-[98%] mx-auto">
      <div className="bg-white">
        <UnitsFilter
          appliedFilters={searchParams}
          developers={developers}
          compounds={compounds}
          clientId={clientId}
          clientName={clientName}
          citiesAndDistricts={citiesAndDistricts}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <Suspense
          key={JSON.stringify(searchParams)}
          fallback={
            <div className="flex items-center justify-center h-full mt-12">
              <Loader2
                size={70}
                className="text-center animate-spin text-primary"
              />
            </div>
          }
        >
          <UnitsList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function UnitsList({ searchParams }) {
  const res = await fetchUnitsFilter(JSON.stringify(searchParams), true);
  const units = res.data?.units || [];

  return <UnitsGrid units={units} />;
}
