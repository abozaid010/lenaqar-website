import UnitDetailsPageQuery from "@/components/ui/unit-details/unit-details-page-query";
import { cookies } from "next/headers";
import { SITE_URL } from "../../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import UnitSchema from "@/components/schema/UnitSchema";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
//...
import axiosInstance from "@/utils/axiosInstance";

async function fetchUnitData(id) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;

    const response = await axiosInstance.get(`/units/details/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data?.data || null;
  } catch (error) {
    console.error("Failed to fetch unit for metadata:", error.message);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const unit = await fetchUnitData(id);

  const clientName = cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value
    ? JSON.parse(cookieStore.get(COOKIE_KEYS.CLIENT_INFO)?.value)?.client_name
    : null;

  const title = unit?.unitTitle
    ? `${unit.unitTitle} - Admin Unit Details | LENAAI AI Sales Agent`
    : clientName
      ? `Admin Unit Details - ${clientName} | LENAAI AI Sales Agent`
      : "Admin Unit Details - AI Sales Agent | LENAAI";
  const description = unit
    ? `${unit.unitTitle || "Property"} - ${unit.area || ""} sqm, ${unit.rooms || ""} rooms. Manage unit details in LENAAI's AI Sales Agent dashboard and track how the AI presents this property to clients.`
    : "View and manage unit details in LENAAI's AI Sales Agent dashboard. Track property information and how the AI engages with clients about this unit.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/units/${id}`,
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}/units/${id}`,
    },
  };
}

export default async function PrivateUnitDetailsPage({ params }) {
  const { id } = await params;
  const unit = await fetchUnitData(id);

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Units",
            url: `${SITE_URL}/units`,
          },
          {
            name: unit?.unitTitle || "Unit Details",
            url: `${SITE_URL}/units/${id}`,
          },
        ]}
      />
      {unit && <UnitSchema unit={unit} isPublic={false} />}
      <UnitDetailsPageQuery unitId={id} isPublic={false} />
    </>
  );
}
