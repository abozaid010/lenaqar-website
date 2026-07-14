import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SITE_URL } from "../../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { transformUnitToViewModel } from "@/lib/units/unit-selectors";
import { isOwnClientUnit } from "@/lib/units/unit-ownership";
import { resolveAdminUnitByCodeParam } from "@/lib/units/unit-legacy-redirect";
import {
  buildAdminUnitDetailPath,
  encodeUnitCodeForPath,
  normalizeUnitCodeParam,
} from "@/lib/units/unit-share-links";
import UnitDetailsPage from "@/components/unit-details/unit-details-page";
import { getServerTranslations } from "@/utils/getServerTranslations";

export async function generateMetadata({ params }) {
  const { code: rawCode } = await params;
  const cookieStore = await cookies();
  const clientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value || null;

  try {
    const rawUnit = await resolveAdminUnitByCodeParam(rawCode, clientId);
    if (!rawUnit) {
      return {
        title: "Unit Not Found",
        description: "The requested unit could not be found.",
      };
    }

    const unit = transformUnitToViewModel(rawUnit);
    const clientName = cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value
      ? JSON.parse(cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value)?.client_name
      : null;
    const normalizedCode = normalizeUnitCodeParam(rawCode);
    const detailPath = normalizedCode
      ? buildAdminUnitDetailPath(normalizedCode, clientId)
      : "/units";

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
        url: `${SITE_URL}${detailPath}`,
        type: "website",
      },
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        canonical: `${SITE_URL}${detailPath}`,
      },
    };
  } catch (error) {
    if (error?.digest?.startsWith?.("NEXT_REDIRECT")) throw error;
    return {
      title: "Admin Unit Details",
      description: "Manage unit details in LENAAI AI Sales Agent dashboard.",
    };
  }
}

export default async function PrivateUnitDetailsPage({ params }) {
  const { code: rawCode } = await params;

  if (!normalizeUnitCodeParam(rawCode)) {
    notFound();
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("lang")?.value || "ar";
  const clientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value || null;
  const { t } = getServerTranslations(locale);

  try {
    const rawUnit = await resolveAdminUnitByCodeParam(rawCode, clientId);
    if (!rawUnit) {
      notFound();
    }

    const unit = transformUnitToViewModel(rawUnit, t, locale);
    const normalizedCode = normalizeUnitCodeParam(rawUnit.code) || rawCode;
    const detailPath = buildAdminUnitDetailPath(normalizedCode, clientId);
    const isOwnUnit = isOwnClientUnit(rawUnit, clientId);

    return (
      <>
        <BreadcrumbSchema
          items={[
            {
              name: "Units",
              url: `${SITE_URL}/units`,
            },
            {
              name: unit.title || "Unit Details",
              url: `${SITE_URL}${detailPath}`,
            },
          ]}
        />
        <UnitDetailsPage unit={unit} rawUnit={rawUnit} isOwnUnit={isOwnUnit} />
      </>
    );
  } catch (error) {
    if (error?.digest?.startsWith?.("NEXT_REDIRECT")) throw error;
    console.error("Error fetching unit:", error?.message ?? error);
    notFound();
  }
}
