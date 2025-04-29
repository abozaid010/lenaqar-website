import {
  fetchcombounds,
  fetchDevelopers,
  fetchUnitById,
} from "@/components/services/serviceFetching";
import UnitPageHeader from "../_components/unit-page-header";
import UnitDetails from "../_components/unit-page-details";

// Dynamic metadata
export async function generateMetadata({ params }) {
  const { id } = await params;
  const unit = await fetchUnitById(id);

  return {
    title: "unit - " + unit?.unitTitle,
    description: `${unit.purpose} a ${unit.buildingType} in ${unit.city}, developed by ${unit.developer}. Delivery status: ${unit.deliveryStatus}.`,
  };
}

const Page = async ({ params }) => {
  const { id } = await params;
  const unit = await fetchUnitById(id);

  const [comboundata, developers] = await Promise.all([
    fetchcombounds(),
    fetchDevelopers(),
  ]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <UnitPageHeader
        unit={unit}
        compounds={comboundata}
        developers={developers}
      />

      <UnitDetails
        unit={unit}
        comboundata={comboundata}
        developers={developers}
      />
    </div>
  );
};

export default Page;
