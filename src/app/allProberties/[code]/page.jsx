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

/** Strip CRM-only fields so they never hydrate into the public page payload. */
function toPublicUnitViewModel(rawUnit) {
  const unit = transformUnitToViewModel(rawUnit);
  return {
    ...unit,
    ownerName: null,
    ownerMobile: null,
    ownerWhatsapp: null,
    author: null,
    phase: null,
    trustItems: (unit.trustItems || []).filter((item) => item.key !== "employee"),
  };
}

async function fetchRawUnit(rawCode) {
  try {
    return await resolvePublicUnitByCodeParam(rawCode);
  } catch (error) {
    if (error?.digest?.startsWith?.("NEXT_REDIRECT")) throw error;
    console.error("Failed to fetch unit:", error.message);
    return null;
  }
}

async function fetchUnitData(rawCode) {
  const rawUnit = await fetchRawUnit(rawCode);
  return rawUnit ? toPublicUnitViewModel(rawUnit) : null;
}

// Same-origin fallback so social crawlers always receive a fetchable image
// (unit has no photos, only a video, or the metadata fetch returned nothing).
const FALLBACK_OG_IMAGE = `${SITE_URL}/images/property_placeholder.jpg`;

// Pick the first *image* hero item — heroImages[0] can be a video embed
// (youtube/facebook/mp4), which is not a valid og:image.
function getFirstImageUrl(unit) {
  const media = unit?.heroImages ?? unit?.images;
  if (!Array.isArray(media)) return null;
  const firstImage = media.find(
    (item) => typeof item === "string" || (item?.url && item?.type !== "video")
  );
  if (!firstImage) return null;
  return typeof firstImage === "string" ? firstImage : firstImage.url;
}

export async function generateMetadata({ params }) {
  const { code: rawCode } = await params;
  const normalizedCode = normalizeUnitCodeParam(rawCode);
  const unit = await fetchUnitData(rawCode);
  const firstImageUrl = getDisplayImageUrl(getFirstImageUrl(unit));
  const ogImageUrl = firstImageUrl || FALLBACK_OG_IMAGE;
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
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: unit?.title || "Property Image",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
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

  const rawUnit = await fetchRawUnit(rawCode);
  if (!rawUnit) {
    notFound();
  }

  const unit = toPublicUnitViewModel(rawUnit);
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
      {/* Public share page: property details only — no owner/author/inquiry CRM UI */}
      <UnitDetailsPage unit={unit} isPublic />
    </>
  );
}
