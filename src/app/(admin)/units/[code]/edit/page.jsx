import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SITE_URL } from "../../../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { resolveAdminEditByCodeParam } from "@/lib/units/unit-legacy-redirect";
import {
  buildAdminUnitEditPath,
  normalizeUnitCodeParam,
} from "@/lib/units/unit-share-links";
import EditUnitClient from "./EditUnitClient";

export async function generateMetadata({ params }) {
  const { code: rawCode } = await params;
  const cookieStore = await cookies();
  const clientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value || null;
  const normalizedCode = normalizeUnitCodeParam(rawCode);
  const editPath = normalizedCode
    ? buildAdminUnitEditPath(normalizedCode, clientId)
    : "/units";

  return {
    title: "Edit Unit - LENAAI AI Sales Agent",
    description:
      "Edit property unit details with LENAAI's Real Estate AI Sales Agent dashboard.",
    keywords: [
      "edit unit",
      "property management",
      "AI Sales Agent dashboard",
      "real estate administration",
    ],
    openGraph: {
      title: "Edit Unit - LENAAI AI Sales Agent",
      description:
        "Edit property unit details with LENAAI's Real Estate AI Sales Agent dashboard.",
      url: `${SITE_URL}${editPath}`,
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}${editPath}`,
    },
  };
}

export default async function EditUnitPage({ params, searchParams: rawSearchParams }) {
  const { code: rawCode } = await params;
  const searchParams = await rawSearchParams;
  const cookieStore = await cookies();
  const clientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value || null;
  const fromPendingApproval = searchParams?.pending === "1";

  if (!normalizeUnitCodeParam(rawCode)) {
    notFound();
  }

  const rawUnit = await resolveAdminEditByCodeParam(rawCode, clientId);
  if (!rawUnit) {
    notFound();
  }

  const unitCode = normalizeUnitCodeParam(rawUnit.code) || rawCode;

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Units",
            url: `${SITE_URL}/units`,
          },
          {
            name: "Edit Unit",
            url: `${SITE_URL}${buildAdminUnitEditPath(unitCode, clientId)}`,
          },
        ]}
      />

      <EditUnitClient
        rawUnit={rawUnit}
        unitCode={unitCode}
        clientId={clientId}
        fromPendingApproval={fromPendingApproval}
      />
    </>
  );
}
