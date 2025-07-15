import UnitsPageQueryOptimized from "@/components/ui/units-page-query-optimized";

export default async function UnitsPage({ searchParams: rawSearchParams }) {
  const searchParams = await rawSearchParams;

  return (
    <div className="container mb-4">
      <UnitsPageQueryOptimized searchParams={searchParams} publicUnits={true} />
    </div>
  );
}
