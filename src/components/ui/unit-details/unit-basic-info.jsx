"use client";
import { useI18n } from "@/hooks/useI18n";
import { useI18n as useRawTranslations } from "@/context/translate-api";
import { getBuildingTypes } from "@/data/constants";
import en from "../../../../public/locales/en";
import ar from "../../../../public/locales/ar";
import { useMemo } from "react";
import { useLocaleConstants } from "@/utils/localeConstants";
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
  Ruler,
} from "lucide-react";
import toast from "react-hot-toast";
import UnitAmenities from "./unit-amenities";
import UnitPricing from "./unit-pricing";

const MISSING_FIELD_CLASS =
  "ring-2 ring-red-500 rounded-md bg-red-50/70 border border-red-200";

export default function UnitBasicInfo({
  unit,
  missingRequiredFields = [],
}) {
  const { locale, common, property, localeUtils } = useI18n();
  const { t } = useRawTranslations();
  const missing = missingRequiredFields || [];
  const isMissing = (field) => missing.includes(field);

  // Guard: allow incomplete/broken units (e.g. from pending approval) so user can edit
  const u = unit || {};
  const safeBuildingType = (u.buildingType || "").toString().toLowerCase();
  const safePurpose = u.purpose || "sell";

  // Get building types with translations
  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);

  // Function to copy phone number to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t?.common?.phoneCopied);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success(t?.common?.phoneCopied);
      } catch (err) {
        toast.error(t?.common?.failedToCopyPhone);
      }
      document.body.removeChild(textArea);
    }
  };

  const openWhatsApp = (phoneNumber) => {
    const formattedNumber = phoneNumber.startsWith("0") && `2${phoneNumber}`;

    const whatsappUrl = `https://wa.me/${formattedNumber}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isMissing("purpose")
              ? "bg-red-100 text-red-800 ring-2 ring-red-500"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {t.purpose?.[safePurpose] || safePurpose}
        </span>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isMissing("buildingType")
              ? "bg-red-100 text-red-800 ring-2 ring-red-500"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {BUILDING_TYPES.find((type) => type.value === safeBuildingType)?.[
            locale === "ar" ? "ar_label" : "en_label"
          ] || u.buildingType || "—"}
        </span>
      </div>

      <h1
        className={`mt-2 text-3xl font-bold text-primary ${
          isMissing("unitTitle") ? MISSING_FIELD_CLASS : ""
        } ${isMissing("unitTitle") ? "p-2" : ""}`}
      >
        {u.unitTitle || property.getUnitTitle()}
      </h1>

      <div
        className={`flex flex-wrap gap-2 mt-2 ${
          isMissing("city") || isMissing("district") || isMissing("project")
            ? MISSING_FIELD_CLASS + " p-2"
            : ""
        }`}
      >
        <span className="inline-flex items-center px-2.5 py-2 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {[
            u.city,
            u.district,
            locale === "ar" ? u.project_ar : u.project,
            u.phase,
          ]
            .filter(Boolean)
            .join(" , ") || "—"}
        </span>
      </div>

      <UnitPricing unit={u} missingRequiredFields={missing} />

      {/* Additional Features */}
      <div className="mt-5 grid grid-cols-3 gap-x-8 gap-y-2 max-w-lg">
        <div
          className={`flex items-center gap-2 ${
            isMissing("developer") ? MISSING_FIELD_CLASS + " p-2" : ""
          }`}
        >
          <Building2 className="h-5 w-5 text-primary shrink-0" />
          <div>
            <span className="text-xs text-gray-500">
              {t.unitDetails?.developer}
            </span>
            <p className="font-medium text-xs">
              {locale === "ar"
                ? u.developer_ar || u.developer
                : u.developer}
              {!(u.developer_ar || u.developer) && "—"}
            </p>
          </div>
        </div>

        {safePurpose === "sell" && (
          <div
            className={`flex items-center gap-2 ${
              isMissing("deliveryDate") ? MISSING_FIELD_CLASS + " p-2" : ""
            }`}
          >
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            <div>
              <span className="text-gray-500 text-xs line-clamp-1">
                {t.unitDetails?.deliveryDate}
              </span>
              <p className="font-medium text-xs whitespace-nowrap">
                {localeUtils.formatDate(u.deliveryDate) || t.unitDetails?.notAvailable}
              </p>
            </div>
          </div>
        )}

        {u.floor != null && u.floor !== 0 && (
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary shrink-0" />
            <div>
              <span className="text-xs line-clamp-1 text-gray-500">
                {t.unitDetails?.floor}
              </span>
              <p className="font-medium text-xs">
                {getFloorLabel(u.floor, t)}
              </p>
            </div>
          </div>
        )}

        <div
          className={`flex items-center gap-2 ${
            isMissing("finishing") ? MISSING_FIELD_CLASS + " p-2" : ""
          }`}
        >
          <Paintbrush className="h-5 w-5 text-primary shrink-0" />
          <div>
            <span className="text-xs line-clamp-1 text-gray-500">
              {t.unitDetails?.finishing}
            </span>
            <p className="font-medium text-xs whitespace-nowrap ">
              {u.finishing
                ? t.unitDetails?.finishingTypes?.[
                    (u.finishing || "").toString().toLowerCase()
                  ] || u.finishing
                : t.unitDetails?.notAvailable}
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 ${
            isMissing("furnishing") ? MISSING_FIELD_CLASS + " p-2" : ""
          }`}
        >
          <Package className="h-5 w-5 text-primary shrink-0" />
          <div>
            <span className="text-xs line-clamp-1 text-gray-500">
              {t.unitDetails?.furnishing}
            </span>
            <p className="font-medium text-xs whitespace-nowrap ">
              {u.furnishing
                ? t.unitDetails?.furnishingTypes?.[
                    (u.furnishing || "").toString().toLowerCase()
                  ] || u.furnishing
                : t.unitDetails?.notAvailable}
            </p>
          </div>
        </div>

        {(u.code != null && u.code !== "") && (
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary shrink-0" />
            <div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {t.basicDetails?.code}
              </span>
              <p
                className="font-medium text-xs max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap"
                title={u.code}
              >
                {u.code}
              </p>
            </div>
          </div>
        )}

        {(u.model != null && u.model !== "") && (
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-primary shrink-0" />
            <div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {t.basicDetails?.model}
              </span>
              <p
                className="font-medium text-xs max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap"
                title={u.model}
              >
                {u.model}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Owner Details - Only show for brokers when owner info is available */}
      {(u.owner_name || u.owner_mobile) && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-slate-800">
            {property.getOwnerDetails()}
          </h3>

          {u.owner_name && u.owner_mobile ? (
            <button
              className="w-5 h-5 bg-green-500 hover:bg-green-600 rounded flex items-center justify-center transition-colors"
              title={common.openWhatsApp}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
              </svg>
            </button>
          ) : null}
        </div>
      )}

      {/* Key Features */}
      <div className="mt-5 grid grid-cols-4 gap-x-1.5 gap-y-2 max-w-lg">
        {/* Land Area */}
        {(u.landArea != null && Number(u.landArea) > 0) && (
          <div className="flex flex-col items-center py-1.5 bg-white rounded-md border border-gray-200 h-20">
            <Ruler className="h-6 w-6 text-primary" />
            <span className="mt-1 text-sm text-gray-500">
              {property.getArea()}
            </span>
            <p className="font-medium text-center text-sm">
              {localeUtils.formatNumber(u.landArea)} m²
            </p>
          </div>
        )}

        {/* View */}
        <div
          className={`flex flex-col items-center justify-between py-1.5 rounded-md border h-20 ${
            isMissing("view")
              ? "bg-red-50/70 border-red-300 ring-2 ring-red-500"
              : "bg-white border-gray-200"
          }`}
        >
          <Eye className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="mt-1 text-sm text-gray-500">
            {property.getView()}
          </span>
          <p className="font-medium text-center break-words text-sm">
            {u.view
              ? t.unitDetails?.viewTypes?.[(u.view || "").toString().toLowerCase()] || u.view
              : t.unitDetails?.notAvailable}
          </p>
        </div>

        {/* Rooms */}
        <div
          className={`flex flex-col items-center py-1.5 rounded-md border h-20 ${
            isMissing("roomsCount")
              ? "bg-red-50/70 border-red-300 ring-2 ring-red-500"
              : "bg-white border-gray-200"
          }`}
        >
          <BedDouble className="h-6 w-6 text-primary" />
          <span className="mt-1 text-sm text-gray-500">
            {property.getRooms()}
          </span>
          <p className="font-medium text-center text-sm">
            {u.roomsCount != null && u.roomsCount !== "" ? u.roomsCount : "—"}
          </p>
        </div>

        {/* Bathrooms */}
        <div
          className={`flex flex-col items-center py-1.5 rounded-md border h-20 ${
            isMissing("bathroomCount")
              ? "bg-red-50/70 border-red-300 ring-2 ring-red-500"
              : "bg-white border-gray-200"
          }`}
        >
          <Bath className="h-6 w-6 text-primary" />
          <span className="text-xs text-gray-500">
            {property.getBathrooms()}
          </span>
          <p className="font-medium text-center text-sm">
            {u.bathroomCount != null && u.bathroomCount !== "" ? u.bathroomCount : "—"}
          </p>
        </div>
      </div>

      {safePurpose === "rent" && (u?.amenities?.length ?? 0) > 0 && (
        <UnitAmenities amenities={u.amenities} t={t} />
      )}
    </div>
  );
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
