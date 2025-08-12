"use client";

import { useUnitDetailsPageData } from "@/hooks/use-unit-details-data";
import Link from "next/link";

import ImageGallary from "@/components/ui/unit-details/image-gallary";
import UnitBasicInfo from "@/components/ui/unit-details/unit-basic-info";
import UnitDetailsChatBot from "@/components/ui/unit-details/unit-details-chatbot";
import UnitPageHeader from "@/components/ui/unit-forms/unit-page-header";

import LoadingSpinner from "@/components/ui/loading-spinner";

export default function UnitDetailsPageQuery({ unitId, isPublic = false }) {
  const { unit, hasAccess, isInitialLoading, errorMessage } =
    useUnitDetailsPageData(unitId, isPublic);

  if (isInitialLoading) {
    return (
      <div className="container mx-auto h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container mx-auto h-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-red-600">
              Error Loading Unit
            </h1>
            <p className="text-gray-600">{errorMessage}</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Show unit details
  if (hasAccess && unit.data) {
    return (
      <div className="container h-full">
        {!isPublic && <UnitPageHeader unit={unit.data} />}

        <div className="bg-white rounded-lg shadow-md overflow-hidden p-3 lg:p-6">
          <div className="flex flex-col md:flex-row gap-4 lg:gap-6 flex-1">
            <ImageGallary
              images={unit.data.images}
              unitName={unit.data.unitTitle}
              unitId={unit.data.unitId}
            />
            <UnitBasicInfo unit={unit.data} />

            {/* Desktop ChatBot - Inline */}
            <div className="hidden xl:block min-w-[360px]">
              <UnitDetailsChatBot isInline={true} unitId={unitId} />
            </div>
          </div>
        </div>

        {/* Mobile ChatBot - Floating Button */}
        <UnitDetailsChatBot isInline={false} unitId={unitId} />
      </div>
    );
  }

  // Fallback
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
            The requested unit could not be found or you don't have access to
            view it.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Go Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
