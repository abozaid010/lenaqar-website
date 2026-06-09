import { notFound } from "next/navigation";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { transformUnitToViewModel } from "@/lib/units/unit-selectors";
import { resolvePublicUnitByCodeParam } from "@/lib/units/unit-legacy-redirect";
import {
  buildPublicUnitShareUrl,
  encodeUnitCodeForPath,
  normalizeUnitCodeParam,
} from "@/lib/units/unit-share-links";
import UnitDetailsPage from "@/components/unit-details/unit-details-page";
import { getDisplayImageUrl } from "@/utils/imageUtils";

async function fetchUnitData(rawCode) {
  try {
    const rawUnit = await resolvePublicUnitByCodeParam(rawCode);
    return rawUnit ? transformUnitToViewModel(rawUnit) : null;
  } catch (error) {
    if (error?.digest?.startsWith?.("NEXT_REDIRECT")) throw error;
    console.error("Failed to fetch unit for metadata:", error.message);
    return null;
  }
}

function getFirstImageUrl(unit) {
  const firstImg = unit?.heroImages?.[0] ?? unit?.images?.[0];
  if (!firstImg) return null;
  return typeof firstImg === "string" ? firstImg : firstImg?.url;
}

export async function generateMetadata({ params }) {
  const { code: rawCode } = await params;
  const normalizedCode = normalizeUnitCodeParam(rawCode);
  const unit = await fetchUnitData(rawCode);
  const firstImageUrl = getDisplayImageUrl(getFirstImageUrl(unit));
  const canonicalPath = normalizedCode
    ? `/allProberties/${encodeUnitCodeForPath(normalizedCode)}`
    : "/allProberties";

  const title = unit?.title
    ? `${unit.title} - Property Details | LENAAI AI Sales Agent`
    : "Property Details - AI Sales Agent | LENAAI";
  const description = unit
    ? `${unit.title || "Property"} - View detailed property information including specifications, pricing, and availability.`
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
      unit?.locationLabel && `properties in ${unit.locationLabel}`,
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      type: "website",
      ...(firstImageUrl && {
        images: [
          {
            url: firstImageUrl,
            width: 1200,
            height: 630,
            alt: unit?.title || "Property Image",
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
      canonical: `${SITE_URL}${canonicalPath}`,
    },
  };
}

export default async function PublicUnitDetailsPage({ params }) {
  const { code: rawCode } = await params;

  if (!normalizeUnitCodeParam(rawCode)) {
    notFound();
  }

  const unit = await fetchUnitData(rawCode);
  if (!unit) {
    notFound();
  }

  const shareUrl = unit.referenceCode
    ? buildPublicUnitShareUrl(unit.referenceCode)
    : `${SITE_URL}/allProberties`;

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "All Properties",
            url: `${SITE_URL}/allProberties`,
          },
          {
            name: unit.title || "Property Details",
            url: shareUrl,
          },
        ]}
      />
      <UnitDetailsPage unit={unit} />
    </>
  );
}
