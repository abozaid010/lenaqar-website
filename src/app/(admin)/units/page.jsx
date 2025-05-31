import {
  fetchcombounds,
  fetchUnitsFilter,
  fetchDevelopers,
  fetchCitisAndProjects,
} from "@/components/services/serviceFetching";
import UnitsGrid from "@/components/ui/units-grid";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { cookies } from "next/headers";
import AddUnitButton from "./_components/add-unit-button";
import ClearAllFilters from "./_components/filters/clear-all-filters";
import SideUnitFilters from "@/components/ui/side-units-filter";
import UnitsFilter from "@/components/ui/units-filter";
import UnitsSearch from "@/components/ui/units-search";

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
  const clientId = cookieStore.get("client_id")?.value;
  const clientName = cookieStore.get("client_info")?.value
    ? JSON.parse(cookieStore.get("client_info")?.value)?.client_name
    : null;

  const [unitsResponse, developers, compounds,citiesAndDistricts] = await Promise.all([
    fetchUnitsFilter(JSON.stringify(searchParams), true),
    fetchDevelopers(),
    fetchcombounds(true),
    fetchCitisAndProjects(),
  ]);

  const units = unitsResponse.data?.units || [];

  const developersSet = Array.from(
    new Set(developers?.map((developer) => developer.name))
  );

  // const maxPrice =
  //   units.length > 0 &&
  //   units
  //     .filter((unit) => unit.purpose === "sell" && unit.totalPrice)
  //     .map((unit) => Number.parseInt(unit.totalPrice, 10))
  //     .reduce((max, price) => (price > max ? price : max), 65000);

  return (
    <div className="w-[98%] mx-auto">
      {/* <div className="mb-4 flex flex-col sm:flex-row items-start justify-between gap-2">
        <AddUnitButton
          clientId={clientId}
          clientName={clientName}
          compounds={compounds}
          developers={developersSet}
        />
      </div> */}

      <div className="   bg-white  ">
        <UnitsFilter
          appliedFilters={searchParams}
          developers={developers}
          compounds={compounds}
          clientId={clientId}
          clientName={clientName}
          citiesAndDistricts={citiesAndDistricts}
        />

        {/* <UnitsSearch /> */}
      </div>

      <div className="flex gap-2">
        {/* <div className="hidden lg:block">
          <SideUnitFilters
            appliedFilters={searchParams}
            developers={developersSet}
            projects={compounds}
            minPrice={0}
            maxPrice={maxPrice}
          />
        </div> */}
        <div className="flex-1 flex flex-col">
          {/* Results Count */}
          {/* <div className="bg-white p-4 rounded-md flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {units.length} {units.length === 1 ? "property" : "properties"}{" "}
              found
            </p>

            {Object.keys(searchParams).length > 0 && <ClearAllFilters />}
          </div> */}

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
    </div>
  );
}

async function UnitsList({ searchParams }) {
  const res = await fetchUnitsFilter(JSON.stringify(searchParams), true);
  const units = res.data?.units || [];

  return <UnitsGrid units={units} />;
}
