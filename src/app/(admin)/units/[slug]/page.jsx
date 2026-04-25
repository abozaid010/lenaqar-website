import { cookies } from "next/headers";
import { SITE_URL } from "../../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getUnitById } from "@/lib/units/unit-api";
import { transformUnitToViewModel } from "@/lib/units/unit-selectors";
import { findUnitBySlug } from "@/lib/units/unit-url-utils";
import UnitDetailsPage from "@/components/unit-details/unit-details-page";
import { getServerTranslations } from "@/utils/getServerTranslations";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  
  try {
    // First try to find unit by slug
    const unitId = await findUnitBySlug(slug);
    
    if (!unitId) {
      return {
        title: 'Unit Not Found',
        description: 'The requested unit could not be found.',
      };
    }

    const response = await getUnitById(unitId);
    const unit = response?.status && response.data?.units?.length
      ? transformUnitToViewModel(response.data.units[0])
      : null;

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
        url: `${SITE_URL}/admin/units/${slug}`,
        type: "website",
      },
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        canonical: `${SITE_URL}/admin/units/${slug}`,
      },
    };
  } catch (error) {
    return {
      title: 'Admin Unit Details',
      description: 'Manage unit details in LENAAI AI Sales Agent dashboard.',
    };
  }
}

export default async function PrivateUnitDetailsPage({
  params,
}) {
  const { slug } = await params;

  try {
    // First try to find unit by slug
    const unitId = await findUnitBySlug(slug);
    
    if (!unitId) {
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
              <h1 className="text-2xl font-bold text-gray-800">Unit Not Found</h1>
              <p className="text-gray-600">
                The requested unit could not be found.
              </p>
            </div>
          </div>
        </div>
      );
    }

    const cookieStore = await cookies();
    const locale = cookieStore.get('lang')?.value || 'ar';
    const { t } = getServerTranslations(locale);
    const response = await getUnitById(unitId);
    if (response?.status && response.data.units.length) {
      const unit = transformUnitToViewModel(response.data.units[0], t, locale);
      return (
        <>
          <BreadcrumbSchema
            items={[
              {
                name: "Units",
                url: `${SITE_URL}/admin/units`,
              },
              {
                name: unit.unitTitle || "Unit Details",
                url: `${SITE_URL}/admin/units/${slug}`,
              },
            ]}
          />
          <UnitDetailsPage unit={unit} />
        </>
      );
    }

    // Fallback if unit not found
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
            <h1 className="text-2xl font-bold text-gray-800">Unit Not Found</h1>
            <p className="text-gray-600">
              The requested unit could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching unit:', error);
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
            <h1 className="text-2xl font-bold text-gray-800">Error Loading Unit</h1>
            <p className="text-gray-600">
              There was an error loading the unit details.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
