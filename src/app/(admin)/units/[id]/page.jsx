import {
  fetchcombounds,
  fetchDevelopers,
  fetchUnitById,
} from "@/components/services/serviceFetching";
import UnitPageHeader from "../_components/unit-page-header";
import ImageGallary from "@/components/ui/unit-details/image-gallary";
import UnitBasicInfo from "@/components/ui/unit-details/unit-basic-info";
import Link from "next/link";

// Dynamic metadata
export async function generateMetadata({ params }) {
  const { id } = await params;
  const unit = await fetchUnitById(id);

  return {
    title: "unit - " + unit.data?.unitTitle,
    description: `${unit.data.purpose} a ${unit.data.buildingType} in ${unit.data.city}, developed by ${unit.data.developer}. Delivery status: ${unit.data.deliveryStatus}.`,
  };
}

const Page = async ({ params }) => {
  const { id } = await params;
  const unit = await fetchUnitById(id);

  const [comboundata, developers] = await Promise.all([
    fetchcombounds(),
    fetchDevelopers(),
  ]);

  let hasAccess = true;
  if (!unit?.status) {
    hasAccess = false;
  }

  const developersSet = Array.from(
    new Set(developers?.map((developer) => developer.name))
  );

  return (
    <div className="container mx-auto h-full">
      {hasAccess ? (
        <>
          <UnitPageHeader
            unit={unit.data}
            compounds={comboundata}
            developers={developersSet}
          />

          <div className="bg-white rounded-lg shadow-md overflow-hidden py-6 p-3">
            <div className="flex flex-col md:flex-row gap-4 lg:gap-6 xl:gap-14 justify-center">
              <ImageGallary
                images={unit.data.images}
                unitName={unit.data.unitTitle}
                unitId={unit.data.unitId}
              />

              <UnitBasicInfo unit={unit.data} />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            You do not have permission to view this chat.
          </p>
          <Link
            href="/dashboard"
            className="underline text-sm text-blue-700 mt-4"
          >
            Go Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
};

export default Page;
