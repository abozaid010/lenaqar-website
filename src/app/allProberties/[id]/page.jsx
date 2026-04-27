import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import UnitSchema from "@/components/schema/UnitSchema";
import { getPublicUnitById } from "@/lib/units/unit-api";
import { transformUnitToViewModel } from "@/lib/units/unit-selectors";
import UnitDetailsPage from "@/components/unit-details/unit-details-page";
import { getDisplayImageUrl } from "@/utils/imageUtils";

async function fetchUnitData(id) {
  try {
    const response = await getPublicUnitById(id);
    return response?.status && response.data?.units?.length 
      ? transformUnitToViewModel(response.data.units[0])
      : null;
  } catch (error) {
    console.error("Failed to fetch unit for metadata:", error.message);
    return null;
  }
}

function getFirstImageUrl(unit) {
  const firstImg = unit?.images?.[0];
  return typeof firstImg === "string" ? firstImg : firstImg?.url;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const unit = await fetchUnitData(id);
  const firstImageUrl = getDisplayImageUrl(getFirstImageUrl(unit));

  const title = unit?.unitTitle
    ? `${unit.unitTitle} - Property Details | LENAAI AI Sales Agent`
    : "Property Details - AI Sales Agent | LENAAI";
  const description = unit
    ? `${unit.unitTitle || "Property"} - ${unit.area || ""} sqm, ${unit.rooms || ""} rooms. ${unit.price ? `Price: ${unit.price} EGP` : ""}. AI Sales Agent helps you learn more, view master plans, payment plans, and answer questions.`
    : "View detailed property information including specifications, pricing, and availability. AI Sales Agent helps with questions, master plans, payment plans, and recommendations.";

  return {
    title,
    description,
    keywords: [
      "property details",
      "real estate",
      "apartment",
      "villa",
      "commercial property",
      unit?.city && `properties in ${unit.city}`,
      unit?.district && `properties in ${unit.district}`,
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/allProberties/${id}`,
      type: "website",
      ...(firstImageUrl && {
        images: [
          {
            url: firstImageUrl,
            width: 1200,
            height: 630,
            alt: unit.unitTitle || "Property Image",
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(firstImageUrl && {
        images: [firstImageUrl],
      }),
    },
    alternates: {
      canonical: `${SITE_URL}/allProberties/${id}`,
    },
  };
}

export default async function PublicUnitDetailsPage({ params }) {
  const { id } = await params;
  const unit = await fetchUnitData(id);

  if (!unit) {
    return (
      <div className="container mx-auto h-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-800">Property Not Found</h1>
            <p className="text-gray-600">
              The requested property could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "All Properties",
            url: `${SITE_URL}/allProberties`,
          },
          {
            name: unit.unitTitle || "Property Details",
            url: `${SITE_URL}/allProberties/${id}`,
          },
        ]}
      />
      <UnitDetailsPage unit={unit} />
    </>
  );
}
