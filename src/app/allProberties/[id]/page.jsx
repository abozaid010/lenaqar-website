import UnitDetailsPageQuery from "@/components/ui/unit-details/unit-details-page-query";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import UnitSchema from "@/components/schema/UnitSchema";
import axiosInstance from "@/utils/axiosInstance";
import { getDisplayImageUrl } from "@/utils/imageUtils";

async function fetchUnitData(id) {
  try {
    const response = await axiosInstance.get(`/public/unit-details/${id}`);
    return response.data?.data || null;
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

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "All Properties",
            url: `${SITE_URL}/allProberties`,
          },
          {
            name: unit?.unitTitle || "Property Details",
            url: `${SITE_URL}/allProberties/${id}`,
          },
        ]}
      />
      {unit && <UnitSchema unit={unit} isPublic={true} />}
      <UnitDetailsPageQuery unitId={id} isPublic={true} />
    </>
  );
}
