import {
  fetchcombounds,
  fetchDevelopers,
  fetchUnitsFilter,
} from "@/components/services/serviceFetching";
import UnitsFilter from "@/components/ui/units-filter";
import UnitsGrid from "@/components/ui/units-grid";

export default async function UnitsPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;

  const [unitsResponse, developers, compounds] = await Promise?.all([
    fetchUnitsFilter(JSON?.stringify(searchParams), false),
    fetchDevelopers(false),
    fetchcombounds(false),
  ]);

  const units = unitsResponse.data?.units || [];

  return (
    <div className="container mx-auto mb-4">
      <div className="mb-4 bg-white ">
        <UnitsFilter
          appliedFilters={searchParams}
          developers={developers}
          compounds={compounds}
          readonly={true}
        />
      </div>

      <UnitsGrid units={units} readonly={true} />
    </div>
  );
}
