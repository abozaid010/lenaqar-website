import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { SITE_URL } from "../../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { loadCanonicalUnitDetail } from "@/lib/units/unit-detail-loader";
import {
  buildAdminUnitShareUrl,
  normalizeUnitCodeParam,
} from "@/lib/units/unit-share-links";
import { isPrivacyRestrictedViewMode } from "@/lib/units/unit-view-mode";
import UnitDetailsPage from "@/components/unit-details/unit-details-page";
import { getServerTranslations } from "@/utils/getServerTranslations";
import { getDisplayImageUrl } from "@/utils/imageUtils";

const FALLBACK_OG_IMAGE = `${SITE_URL}/images/property_placeholder.jpg`;

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
  const cookieStore = await cookies();
  const headerStore = await headers();
  const browserPathname = headerStore.get("x-lena-pathname");
  const locale = cookieStore.get("lang")?.value || "ar";

  try {
    const { t } = await getServerTranslations(locale);
    const loaded = await loadCanonicalUnitDetail({
      rawCode,
      browserPathname,
      t,
      locale,
    });
    if (!loaded) {
      return {
        title: "Unit Not Found",
        description: "The requested unit could not be found.",
      };
    }

    const { unit, viewMode, listingClientId, detailPath, normalizedCode } =
      loaded;
    const isPrivacy = isPrivacyRestrictedViewMode(viewMode);
    const absoluteUrl = listingClientId
      ? buildAdminUnitShareUrl(normalizedCode, listingClientId)
      : `${SITE_URL}${detailPath}`;

    if (isPrivacy) {
      const firstImageUrl = getDisplayImageUrl(getFirstImageUrl(unit));
      const ogImageUrl = firstImageUrl || FALLBACK_OG_IMAGE;
      const title = unit?.title
        ? `${unit.title} - Property Details | LENAAI AI Sales Agent`
        : "Property Details - AI Sales Agent | LENAAI";
      const description = unit
        ? `${unit.title || "Property"} - View detailed property information including specifications, pricing, and availability.`
        : "View detailed property information including specifications, pricing, and availability.";

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
          url: absoluteUrl,
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
          canonical: absoluteUrl,
        },
      };
    }

    const clientName = cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value
      ? JSON.parse(cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value)?.client_name
      : null;
    const title = unit?.title
      ? `${unit.title} - Admin Unit Details | LENAAI AI Sales Agent`
      : clientName
        ? `Admin Unit Details - ${clientName} | LENAAI AI Sales Agent`
        : "Admin Unit Details - AI Sales Agent | LENAAI";
    const description = unit
      ? `${unit.title || "Property"} - Manage unit details in LENAAI's AI Sales Agent dashboard.`
      : "View and manage unit details in LENAAI's AI Sales Agent dashboard.";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: absoluteUrl,
        type: "website",
      },
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        canonical: absoluteUrl,
      },
    };
  } catch (error) {
    if (error?.digest?.startsWith?.("NEXT_REDIRECT")) throw error;
    return {
      title: "Unit Details",
      description: "View unit details in LENAAI AI Sales Agent.",
    };
  }
}

export default async function CanonicalUnitDetailsPage({ params }) {
  const { code: rawCode } = await params;

  if (!normalizeUnitCodeParam(rawCode)) {
    notFound();
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
  const browserPathname = headerStore.get("x-lena-pathname");
  const locale = cookieStore.get("lang")?.value || "ar";
  const { t } = await getServerTranslations(locale);

  try {
    const loaded = await loadCanonicalUnitDetail({
      rawCode,
      browserPathname,
      t,
      locale,
    });
    if (!loaded) {
      notFound();
    }

    const {
      unit,
      rawUnit,
      isOwnUnit,
      viewMode,
      listingClientId,
      detailPath,
      normalizedCode,
    } = loaded;

    const breadcrumbUrl = listingClientId
      ? buildAdminUnitShareUrl(normalizedCode, listingClientId)
      : `${SITE_URL}${detailPath}`;
    const isPrivacy = isPrivacyRestrictedViewMode(viewMode);
    const unitsListUrl = listingClientId
      ? `${SITE_URL}/${listingClientId}/units`
      : `${SITE_URL}/units`;

    return (
      <>
        <BreadcrumbSchema
          items={[
            {
              name: isPrivacy ? "All Properties" : "Units",
              url: isPrivacy ? `${SITE_URL}/allProberties` : unitsListUrl,
            },
            {
              name: unit.title || "Unit Details",
              url: breadcrumbUrl,
            },
          ]}
        />
        <UnitDetailsPage
          unit={unit}
          rawUnit={rawUnit}
          isOwnUnit={isOwnUnit}
          viewMode={viewMode}
          listingClientId={listingClientId}
        />
      </>
    );
  } catch (error) {
    if (error?.digest?.startsWith?.("NEXT_REDIRECT")) throw error;
    console.error("Error fetching unit:", error?.message ?? error);
    notFound();
  }
}
