"use client";
import { useI18n } from "@/context/translate-api";
import UnitAmenities from "./unit-amenities";
import UnitPricing from "./unit-pricing";
// import { useI18n } from "@/context/translate-api";

export default function Uni({ unit }) {
  const { t } = useI18n();
  return (
    <div className="w-full md:w-1/2 xl:w-2/5">
      <div className="flex items-center">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
          {unit.purpose}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {unit.buildingType.charAt(0).toUpperCase() +
            unit.buildingType.slice(1)}
        </span>
      </div>

      <h1 className="mt-2 text-3xl font-bold text-primary">{unit.unitTitle}</h1>

      {unit.code && (
        <p className="text-sm text-gray-600">
          unit code: <span className="font-semibold">{unit.code}</span>
        </p>
      )}

      {unit.model && (
        <p className="text-sm text-gray-600">
          unit model: <span className="font-semibold">{unit.model}</span>
        </p>
      )}

      <p className="text-sm text-gray-600">
        {unit.project}, {unit.city}
      </p>

      <UnitPricing unit={unit} />

      {/* Additional Features */}
      <div className="mt-5 grid grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-2 max-w-lg">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-primary mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <div>
            <span className="text-xs text-gray-500">
              {t.unitDetails?.developer}
            </span>
            <p className="font-medium text-xs">
              {unit.developer || t.unitDetails.notAvailable}
            </p>
          </div>
        </div>

        {unit.purpose === "sell" && (
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-primary mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <span className="text-gray-500 text-xs line-clamp-1">
                {t.unitDetails?.deliveryDate}
              </span>
              <p className="font-medium text-xs whitespace-nowrap">
                {formatDate(unit.deliveryDate) || t.unitDetails.notAvailable}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-primary mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <div>
            <span className="text-xs line-clamp-1 text-gray-500">
              {t.unitDetails.floor}
            </span>
            <p className="font-medium text-xs">
              <span className="font-bold">{t.unitDetails.floor}:</span>{" "}
              {getFloorLabel(unit.floor, t)}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-primary mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          <div>
            <span className="text-xs line-clamp-1 text-gray-500">
              {t.unitDetails?.finishing}
            </span>
            <p className="font-medium text-xs">
              {unit.finishing || t.unitDetails?.notAvailable}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-primary mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7m-6 0H9m6 0l-3-3m3 3l3-3m-3 3l-3-3m0 0L9 4"
            />
          </svg>
          <div>
            <span className="text-xs line-clamp-1 text-gray-500">
              {t.unitDetails.finishing}
            </span>
            <p className="font-medium text-xs whitespace-nowrap ">
              {unit.furnishing || t.unitDetails?.notAvailable}
            </p>
          </div>
          {/* <p>{t.unitDetails.deliveryDate}</p> */}
        </div>
      </div>

      {/* Key Features */}
      <div className="mt-5 flex gap-2 items-center">
        {unit.landArea > 0 && (
          <div className="flex flex-col items-center py-1.5 bg-white rounded-md border border-gray-200 h-22 w-24">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="mt-1 text-sm text-gray-500">
              {t.unitDetails.area}
            </span>
            <span className="font-medium">{unit.landArea} m²</span>
          </div>
        )}

        <div className="flex flex-col items-center py-1.5 bg-white rounded-md border border-gray-200 h-20 w-24">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span className="mt-1 text-sm text-gray-500">
            {t.unitDetails.view}
          </span>
          <span className="font-medium">
            {unit.view || t.unitDetails?.notAvailable}
          </span>
        </div>

        <div className="flex flex-col items-center py-1.5 bg-white rounded-md border border-gray-200 h-20 w-24">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="mt-1 text-sm text-gray-500">
            {t.unitDetails.rooms}
          </span>
          <span className="font-medium">{unit.roomsCount}</span>
        </div>

        <div className="flex flex-col items-center py-1.5 bg-white rounded-md border border-gray-200 h-20 w-24">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="mt-1 text-sm text-gray-500">{t.bathrooms}</span>
          <span className="font-medium">{unit.bathroomCount}</span>
        </div>
      </div>

      {unit.purpose === "rent" && unit?.amenities.length > 0 && (
        <UnitAmenities amenities={unit.amenities} t={t} />
      )}
    </div>
  );
}

// Helper functions
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getFloorLabel(floor, t) {
  if (!floor) return t.unitDetails?.ground;
  const floorNum = Number.parseInt(floor);
  if (floorNum === 0) return t.unitDetails.ground;
  if (floorNum === 1) return t.unitDetails.first;
  if (floorNum === 2) return t.unitDetails.second;
  if (floorNum === 3) return t.unitDetails.third;
  return `${floorNum}${t.unitDetails.th}`;
}
