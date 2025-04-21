import UnitDetails from "@/components/dashbord/pages/UnitDetails";
import {
  fetchcombounds,
  fetchDevelopers,
  fetchUnitById,
} from "@/components/services/serviceFetching";

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
    <UnitDetails
      unit={unit}
      comboundata={comboundata}
      developers={developers}
    />
  );
};

export default Page;
