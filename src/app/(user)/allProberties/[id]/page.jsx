import { fetchUnitByIdpublic } from "@/components/services/serviceFetching";
import ChatBot from "@/components/ui/ChatBot";
import ImageGallary from "@/components/ui/unit-details/image-gallary";
import UnitBasicInfo from "@/components/ui/unit-details/unit-basic-info";

// Dynamic metadata
export async function generateMetadata({ params }) {
  const { id } = await params;
  const unit = await fetchUnitByIdpublic(id);

  return {
    title: "unit - " + unit?.unitTitle,
    description: `${unit.purpose} a ${unit.buildingType} in ${unit.city}, developed by ${unit.developer}. Delivery status: ${unit.deliveryStatus}.`,
  };
}

const Page = async ({ params }) => {
  const { id } = await params;
  const unit = await fetchUnitByIdpublic(id);
  console.log(unit)

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden py-6 p-3">
        <div className="flex flex-col md:flex-row gap-4 lg:gap-6 xl:gap-14 justify-center ">
          <ImageGallary images={unit?.images} unitName={unit?.unitTitle} readOnly={true} />

          <UnitBasicInfo unit={unit} />
          <ChatBot/>
        </div>
      </div>
    </>
  );
};

export default Page;
