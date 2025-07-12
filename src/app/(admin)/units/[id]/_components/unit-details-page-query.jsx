"use client";

import { useAdminSharedData } from "@/hooks/use-admin-shared-data";
import { useUnitDetailsPageData } from "@/hooks/use-unit-details-data";
import Link from "next/link";

import ImageGallary from "@/components/ui/unit-details/image-gallary";
import UnitBasicInfo from "@/components/ui/unit-details/unit-basic-info";
import UnitPageHeader from "../../_components/unit-page-header";

import { Loader2 } from "lucide-react";

export default function UnitDetailsPageQuery({ unitId, clientId }) {
  const { unit, hasAccess, isAccessDenied, isInitialLoading, errorMessage } =
    useUnitDetailsPageData(unitId);

  const { developers, compounds, citiesAndDistricts, isSharedDataLoading } =
    useAdminSharedData();

  // Show loading state
  if (isInitialLoading || isSharedDataLoading) {
    return (
      <div className="container mx-auto h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={70}
            className="text-center animate-spin text-primary"
          />
          {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading unit details...</p> */}
        </div>
      </div>
    );
  }

  // Show error state
  if (errorMessage) {
    return (
      <div className="container mx-auto h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600 mt-2">{errorMessage}</p>
          <Link
            href="/dashboard"
            className="underline text-sm text-blue-700 mt-4 inline-block"
          >
            Go Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Show access denied
  if (isAccessDenied || !hasAccess) {
    return (
      <div className="container mx-auto h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            You do not have permission to view this unit.
          </p>
          <Link
            href="/dashboard"
            className="underline text-sm text-blue-700 mt-4 inline-block"
          >
            Go Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Show unit details
  if (hasAccess && unit.data) {
    return (
      <div className="container mx-auto h-full">
        <UnitPageHeader
          unit={unit.data}
          compounds={compounds.data}
          developers={developers.data}
          citiesAndDistricts={citiesAndDistricts.data}
          clientId={clientId}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden py-6 p-3">
          <div className="flex flex-col md:flex-row gap-4 lg:gap-6 xl:gap-14 justify-center">
            <ImageGallary
              images={unit.data.images}
              unitName={unit.data.unitTitle}
              unitId={unit.data.unitId}
            />

            <UnitBasicInfo unit={unit.data} />
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="container mx-auto h-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Unit Not Found</h1>
        <p className="text-gray-600 mt-2">
          The requested unit could not be found.
        </p>
        <Link
          href="/dashboard"
          className="underline text-sm text-blue-700 mt-4 inline-block"
        >
          Go Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
