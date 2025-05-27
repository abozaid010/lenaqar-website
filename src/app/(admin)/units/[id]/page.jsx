import {
  fetchCitisAndProjects,
  fetchcombounds,
  fetchDevelopers,
  fetchUnitById,
} from "@/components/services/serviceFetching";
import UnitPageHeader from "../_components/unit-page-header";
import ImageGallary from "@/components/ui/unit-details/image-gallary";
import UnitBasicInfo from "@/components/ui/unit-details/unit-basic-info";
import Link from "next/link";
import { cookies } from "next/headers";

// Dynamic metadata
export async function generateMetadata() {
  const cookieStore = await cookies();

  const clientName = cookieStore.get("client_info")?.value
    ? JSON.parse(cookieStore.get("client_info")?.value)?.client_name
    : null;

  return {
    title: clientName ? `LENAAI | ${clientName}` : "LENAAI",
    description: `LENAAI, your AI property consultant.`,
  };
}

const Page = async ({ params }) => {
  const { id } = await params;
  const unit = await fetchUnitById(id);
  const cookieStore = await cookies();

  const clientId = cookieStore.get("client_id")?.value;

  const [comboundata, developers, citiesAndDistricts] = await Promise.all([
    fetchcombounds(),
    fetchDevelopers(),
    fetchCitisAndProjects(),
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
            citiesAndDistricts={citiesAndDistricts}
            clientId={clientId}
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
            You do not have permission to view this unit.
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
