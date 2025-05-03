import {
  fetchcombounds,
  fetchUnitsFilter,
  fetchDevelopers,
} from "@/components/services/serviceFetching";
import UnitsGrid from "./_components/units-grid";
import UnitsFilter from "./_components/units-filter";
import UnitsSearch from "./_components/units-search";
import { cookies } from "next/headers";
import AddUnitButton from "./_components/add-unit-button";
import IdentifierUnit from "./_components/IdentifierUnit";

export async function generateMetadata() {
  const cookieStore = await cookies();

  const clientName = JSON.parse(
    cookieStore.get("client_info")?.value
  )?.client_name;

  return {
    title: clientName ? `Units | ${clientName}` : "LENAAI",
    description: `LENAAI, your AI property consultant.`,
  };
}

export default async function UnitsPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;

  const cookieStore = await cookies();
  const clientId = cookieStore.get("client_id")?.value;
  const clientName = JSON.parse(
    cookieStore.get("client_info")?.value
  )?.client_name;
  const use = true;

  const [unitsResponse, developers, compounds] = await Promise.all([
    fetchUnitsFilter(JSON.stringify(searchParams), use),
    fetchDevelopers(),
    fetchcombounds(),
  ]);

  const units = unitsResponse.data?.units || [];

  console.log(units);

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex items-start justify-between gap-2">
        <IdentifierUnit />

        <AddUnitButton
          clientId={clientId}
          clientName={clientName}
          compounds={compounds}
          developers={developers}
        />
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
