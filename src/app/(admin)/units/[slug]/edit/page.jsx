import { cookies } from "next/headers";
import { SITE_URL } from "../../../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { findUnitBySlug } from "@/lib/units/unit-url-utils";
import { getUnitById } from "@/lib/units/unit-api";
import { transformUnitToViewModel } from "@/lib/units/unit-selectors";
import EditUnitClient from "./EditUnitClient";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  return {
    title: `Edit Unit - LENAAI AI Sales Agent`,
    description: "Edit property unit details with LENAAI's Real Estate AI Sales Agent dashboard.",
    keywords: [
      "edit unit",
      "property management",
      "AI Sales Agent dashboard",
      "real estate administration",
    ],
    openGraph: {
      title: "Edit Unit - LENAAI AI Sales Agent",
      description: "Edit property unit details with LENAAI's Real Estate AI Sales Agent dashboard.",
      url: `${SITE_URL}/admin/units/${slug}/edit`,
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}/admin/units/${slug}/edit`,
    },
  };
}

export default async function EditUnitPage({ params }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  
  // Find unit by slug to get unitId
  const unitId = await findUnitBySlug(slug);
  
  if (!unitId) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Unit Not Found</h1>
          <p className="text-red-600">The unit you're trying to edit could not be found.</p>
          <a href="/admin/units" className="text-blue-600 hover:text-blue-800 underline">
            ← Back to Units
          </a>
        </div>
      </div>
    );
  }
  
  // Get unit data
  const response = await getUnitById(unitId);
  
  if (!response?.status || !response.data?.units?.length) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Error Loading Unit</h1>
          <p className="text-red-600">Failed to load unit data. Please try again.</p>
          <a href="/admin/units" className="text-blue-600 hover:text-blue-800 underline">
            ← Back to Units
          </a>
        </div>
      </div>
    );
  }
  
  const rawUnit = response.data.units[0];
  const unit = transformUnitToViewModel(rawUnit);
  
  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Units",
            url: `${SITE_URL}/admin/units`,
          },
          {
            name: "Edit Unit",
            url: `${SITE_URL}/admin/units/${slug}/edit`,
          },
        ]}
      />
      
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Unit</h1>
            
            <EditUnitClient 
              rawUnit={rawUnit}
              slug={slug}
            />
          </div>
        </div>
      </div>
    </>
  );
}
