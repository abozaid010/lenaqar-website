import { notFound } from "next/navigation";
import { SITE } from "@/config/site";
import { buildingTypeAr } from "@/lib/lenaqar/listing-seo";
import { listingShareImages } from "@/lib/lenaqar/listing-og-image";
import { requirementPath } from "@/lib/lenaqar/requirement-public";
import { fetchPublicRequirementById } from "@/lib/lenaqar/requirements.server";
import ar from "../../../../../public/locales/ar.js";
import RequestDetailContent from "./request-detail-content";

// Same window as the homepage feed; the backend's takedown expires it at once.
export const revalidate = 300;

const copy = ar.lenaqar.requestPage;

function summaryAr(requirement) {
  const loc = requirement?.locations?.[0] || {};
  const place = [
    loc.projectAr || loc.project,
    loc.subDistrictAr || loc.subDistrict,
    loc.districtAr || loc.district,
  ]
    .filter(Boolean)
    .join("، ");
  return [buildingTypeAr(requirement?.propertyTypes?.[0]), place]
    .filter(Boolean)
    .join(" — ");
}

export async function generateMetadata({ params }) {
  const { publicId } = await params;
  const { requirement } = await fetchPublicRequirementById(publicId);
  const summary = requirement ? summaryAr(requirement) : "";
  const title = requirement
    ? summary
      ? copy.metaTitle.replace("{summary}", summary)
      : copy.metaTitleFallback
    : copy.unavailableTitle;
  const description = requirement
    ? copy.metaDescription.replace("{summary}", summary || copy.metaTitleFallback)
    : copy.unavailableDescription;
  const url = requirement ? `${SITE.url}${requirementPath(requirement.id)}` : SITE.url;
  const images = listingShareImages(null, {
    fallbackUrl: `${SITE.url}/images/default_logo.jpg`,
    alt: title,
  });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      locale: SITE.ogLocale,
      siteName: SITE.name,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((image) => image.url),
    },
    alternates: { canonical: url },
    // Requests expire once fulfilled: shareable, never indexed (owner, 2026-11-18).
    robots: { index: false, follow: true },
  };
}

export default async function RequestDetailPage({ params }) {
  const { publicId } = await params;
  const { requirement } = await fetchPublicRequirementById(publicId);
  if (!requirement) notFound();
  return <RequestDetailContent requirement={requirement} />;
}
