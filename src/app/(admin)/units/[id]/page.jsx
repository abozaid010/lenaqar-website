import {
  fetchcombounds,
  fetchDevelopers,
  fetchUnitById,
} from "@/components/services/serviceFetching";
import UnitPageHeader from "../_components/unit-page-header";
import ImageGallary from "../_components/unit-details/image-gallary";
import UnitBasicInfo from "../_components/unit-details/unit-basic-info";

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
    <>
      <UnitPageHeader
        unit={unit}
        compounds={comboundata}
        developers={developers}
      />

      <div className="bg-white rounded-lg shadow-md overflow-hidden py-6 p-3">
        <div className="flex flex-col md:flex-row gap-4 lg:gap-6 justify-center">
          <ImageGallary images={unit.images} />

          <UnitBasicInfo unit={unit} />
        </div>
      </div>
    </>
  );
};

export default Page;
