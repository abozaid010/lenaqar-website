"use client";
import { useI18n } from "@/context/translate-api";
import { BUILDING_TYPES } from "@/data/constants";
import { formatCityLabel, formatDistrictLabel } from "@/utils/formatters";
import {
  Bath,
  BedDouble,
  Box,
  Building2,
  Calendar,
  Eye,
  Hash,
  Layers,
  Package,
  Paintbrush,
  Phone,
  Ruler,
  User,
} from "lucide-react";
import UnitAmenities from "./unit-amenities";
import UnitPricing from "./unit-pricing";

export default function UnitBasicInfo({ unit }) {
  const { t, locale } = useI18n();

  return (
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {t.purpose?.[unit.purpose] || unit.purpose}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {BUILDING_TYPES.find(
            (type) => type.value === unit.buildingType.toLowerCase()
          )?.[locale === "ar" ? "ar_label" : "en_label"] || unit.buildingType}
        </span>
      </div>

      <h1 className="mt-2 text-3xl font-bold text-primary">{unit.unitTitle}</h1>

      <div className="flex flex-wrap gap-2 mt-2">
        <span className="inline-flex items-center px-2.5 py-2 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {[
            formatCityLabel(unit.city, locale),
            formatDistrictLabel(unit.district, unit.city, locale),
            locale === "ar" ? unit.project_ar : unit.project,
            unit.phase,
          ]
            .filter(Boolean)
            .join(" , ")}
        </span>
      </div>

      <UnitPricing unit={unit} />

      {/* Additional Features */}
      <div className="mt-5 grid grid-cols-3 gap-x-8 gap-y-2 max-w-lg">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary shrink-0" />
          <div>
            <span className="text-xs text-gray-500">
              {t.unitDetails?.developer}
            </span>
            <p className="font-medium text-xs">
              {locale === "ar"
                ? unit.developer_ar || unit.developer
                : unit.developer}
            </p>
          </div>
        </div>

        {unit.purpose === "sell" && (
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary shrink-0" />
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

        {unit.floor !== 0 && (
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary shrink-0" />
            <div>
              <span className="text-xs line-clamp-1 text-gray-500">
                {t.unitDetails.floor}
              </span>
              <p className="font-medium text-xs">
                {getFloorLabel(unit.floor, t)}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Paintbrush className="h-5 w-5 text-primary shrink-0" />
          <div>
            <span className="text-xs line-clamp-1 text-gray-500">
              {t.unitDetails?.finishing}
            </span>
            <p className="font-medium text-xs whitespace-nowrap ">
              {unit.finishing
                ? t.unitDetails?.finishingTypes?.[
                    unit.finishing.toLowerCase()
                  ] || unit.finishing
                : t.unitDetails?.notAvailable}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary shrink-0" />
          <div>
            <span className="text-xs line-clamp-1 text-gray-500">
              {t.unitDetails.finishing}
            </span>
            <p className="font-medium text-xs whitespace-nowrap ">
              {unit.furnishing
                ? t.unitDetails?.furnishingTypes?.[
                    unit.furnishing.toLowerCase()
                  ] || unit.furnishing
                : t.unitDetails?.notAvailable}
            </p>
          </div>
        </div>

        {unit.code && (
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary shrink-0" />
            <div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {t.basicDetails.code}
              </span>
              <p
                className="font-medium text-xs max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap"
                title={unit.code}
              >
                {unit.code}
              </p>
            </div>
          </div>
        )}

        {unit.model && (
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-primary shrink-0" />
            <div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {t.basicDetails.model}
              </span>
              <p
                className="font-medium text-xs max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap"
                title={unit.model}
              >
                {unit.model}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Owner Details - Only show for brokers when owner info is available */}
      {(unit.owner_name || unit.owner_mobile) && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-slate-800">
            {t.saleDetails?.ownerDetails || "Owner Information"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unit.owner_name && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="text-xs text-gray-500 block">
                    {t.formLabels.ownerName || "Owner Name"}
                  </span>
                  <p className="font-medium text-sm">{unit.owner_name}</p>
                </div>
              </div>
            )}

            {unit.owner_mobile && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="text-xs text-gray-500 block">
                    {t.formLabels.ownerPhone || "Owner Mobile"}
                  </span>
                  <p className="font-medium text-sm">
                    <a
                      href={`tel:+2${unit.owner_mobile}`}
                      className="text-primary hover:underline"
                    >
                      {unit.owner_mobile}
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Features */}
      <div className="mt-5 grid grid-cols-4 gap-x-1.5 gap-y-2 max-w-lg">
        {/* Land Area */}
        {unit.landArea > 0 && (
          <div className="flex flex-col items-center py-1.5 bg-white rounded-md border border-gray-200 h-20">
            <Ruler className="h-6 w-6 text-primary" />
            <span className="mt-1 text-sm text-gray-500">
              {t.unitDetails.area}
            </span>
            <p className="font-medium text-center text-sm">
              {unit.landArea} m²
            </p>
          </div>
        )}

        {/* View */}
        <div className="flex flex-col items-center justify-between py-1.5 bg-white rounded-md border border-gray-200 h-20">
          <Eye className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="mt-1 text-sm text-gray-500">
            {t.unitDetails.view}
          </span>
          <p className="font-medium text-center break-words text-sm">
            {unit.view
              ? t.unitDetails?.viewTypes?.[unit.view.toLowerCase()] || unit.view
              : t.unitDetails?.notAvailable}
          </p>
        </div>

        {/* Rooms */}
        <div className="flex flex-col items-center py-1.5 bg-white rounded-md border border-gray-200 h-20">
          <BedDouble className="h-6 w-6 text-primary" />
          <span className="mt-1 text-sm text-gray-500">
            {t.unitDetails.rooms}
          </span>
          <p className="font-medium text-center text-sm">{unit.roomsCount}</p>
        </div>

        {/* Bathrooms */}
        <div className="flex flex-col items-center py-1.5 bg-white rounded-md border border-gray-200 h-20">
          <Bath className="h-6 w-6 text-primary" />
          <span className="mt-1 text-sm text-gray-500">{t.bathrooms}</span>
          <p className="font-medium text-center text-sm">
            {unit.bathroomCount}
          </p>
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
