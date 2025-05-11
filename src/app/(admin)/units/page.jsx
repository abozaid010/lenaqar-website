import {
  fetchcombounds,
  fetchUnitsFilter,
  fetchDevelopers,
  fetchProjects,
} from "@/components/services/serviceFetching";
import UnitsGrid from "@/components/ui/units-grid";
import UnitsFilter from "@/components/ui/units-filter";
import UnitsSearch from "@/components/ui/units-search";
import { cookies } from "next/headers";
import AddUnitButton from "./_components/add-unit-button";

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

  const [unitsResponse, developers, compounds, projectsData] =
    await Promise.all([
      fetchUnitsFilter(JSON.stringify(searchParams), true),
      fetchDevelopers(),
      fetchcombounds(),
      fetchProjects(),
    ]);

  const units = unitsResponse.data?.units || [];
  console.log(projectsData);

  const developersSet = Array.from(
    new Set(developers?.map((developer) => developer.name))
  );

  return (
    <div className="container mx-auto">
      <div className="mb-4 flex flex-col sm:flex-row items-start justify-between gap-2">
        <AddUnitButton
          clientId={clientId}
          clientName={clientName}
          compounds={compounds}
          developers={developersSet}
          projectsData={projectsData}
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
