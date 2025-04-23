import {
  fetchcombounds,
  fetchUnitsFilter,
  fetchDevelopers,
} from "@/components/services/serviceFetching";
import UnitsGrid from "./components/units-grid";
import UnitsFilter from "./components/units-filter";
import UnitsSearch from "./components/units-search";

import { cookies } from "next/headers";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const clientName = JSON.parse(
    cookieStore.get("client_info").value
  ).client_name;

  return {
    title: clientName ? `Units | ${clientName}` : "LENAAI",
    description: `LENAAI, your AI property consultant.`,
  };
}

export default async function UnitsPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;

  const [unitsResponse, developers, compounds] = await Promise.all([
    fetchUnitsFilter(JSON.stringify(searchParams)),
    fetchDevelopers(),
    fetchcombounds(),
  ]);

  const units = unitsResponse.data?.units || [];

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Real Estate Properties
        </h1>
        <p className="text-gray-600 mt-1">Explore our exclusive listings</p>
      </div>

      <div className="mb-4 p-3 bg-white rounded-md shadow-2xl flex flex-col gap-3">
        <UnitsFilter
          appliedFilters={searchParams}
          developers={developers}
          compounds={compounds}
        />

        <UnitsSearch />
      </div>
      <UnitsGrid units={units} />
    </div>
  );
}
