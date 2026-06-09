"use client";

import { useI18n } from "@/hooks/useI18n";
import Link from "next/link";
import { Share2 } from "lucide-react";

import ImageWithLoader from "@/components/ui/image-with-loader";
import UnitsGridPagination from "@/components/ui/units-grid-pagination";
import UnitShareLinksDialog from "@/components/unit-details/unit-share-links-dialog";
import {
  buildAdminUnitDetailPath,
  buildPublicUnitDetailPath,
} from "@/lib/units/unit-share-links";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { useState } from "react";
import {
  handleImageError,
  getFirstValidImage,
  getFallbackImage,
  getDisplayImageUrl,
} from "@/utils/imageUtils";
import EmptyStateVideo from "./empty-state-video";

export default function UnitsGrid({
  units,
  pagination,
  readonly = false,
  allowMissingFields = false,
  /** When set (e.g. "?pending=1"), appended to unit detail links so details page can highlight missing fields */
  linkQueryParams = "",
}) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUnitCode, setShareUnitCode] = useState(null);
  const { t, locale, translate, localeUtils } = useI18n();
  const clientId = LenaCookiesManager.getClientId();

  const egpLabel = translate("currency.egp") || "EGP";

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") return null;
    const n = typeof price === "number" ? price : Number(String(price).replace(/,/g, ""));
    if (!Number.isFinite(n)) return null;
    return localeUtils?.formatNumber ? localeUtils.formatNumber(n) : n.toLocaleString();
  };

  const getUnitHref = (unit) => {
    if (!unit?.code?.trim()) return "#";
    const path = readonly
      ? buildPublicUnitDetailPath(unit.code)
      : buildAdminUnitDetailPath(unit.code, clientId);
    return path + (linkQueryParams || "");
  };

  const handleShareClick = (code, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!code?.trim()) return;
    setShareUnitCode(code.trim());
    setShowShareDialog(true);
  };

  return (
    <>
      {units.length === 0 ? (
        <EmptyStateVideo variant="units" autoPlay showControls loop />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3  mt-4">
          {units.map((u, idx) => (
            <Link
              href={u.code?.trim() ? getUnitHref(u) : "#"}
              key={u.unitId ?? u.code ?? idx}
              className="relative"
            >
              {/* Image Section */}
              <div className="relative w-full h-92 overflow-hidden rounded-md shadow-lg bg-gray-100 isolate">
                {u.images && u.images.length > 0 ? (
                  <ImageWithLoader
                    src={getDisplayImageUrl(getFirstValidImage(
                      u.images.map((img) => img?.url),
                      "property"
                    ))}
                    alt={u.name || u.compound || t?.common?.property || "Property"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const originalSrc = u.images[0]?.url;

                      if (!originalSrc) {
                        if (e.currentTarget) {
                          e.currentTarget.src = getFallbackImage("property");
                          e.currentTarget.onerror = null;
                        }
                        return;
                      }

                      const fallbackSrc = handleImageError(
                        e,
                        originalSrc,
                        "property"
                      );
                      if (fallbackSrc !== originalSrc && e.currentTarget) {
                        e.currentTarget.src = fallbackSrc;
                        e.currentTarget.onerror = null;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <svg
                        className="w-12 h-12 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-xs">No image</span>
                    </div>
                  </div>
                )}

                {!readonly ? (
                  <div>
                    <p
                      style={{ fontWeight: "500" }}
                      className="absolute text-[14px] top-3 rounded-sm left-5 cursor-pointer bg-primary text-white px-2 capitalize"
                    >
                      {t.for}
                      {u.purpose === "rent" || u.purpose === "Rent"
                        ? t.rent
                        : u.purpose === "sell" || u.purpose === "Sell"
                          ? t.sell
                          : allowMissingFields
                            ? "—"
                            : t.sell}
                    </p>
                  </div>
                ) : null}

                {u.code?.trim() && (
                  <button
                    type="button"
                    onClick={(e) => handleShareClick(u.code, e)}
                    className="absolute top-3 end-3 z-30 p-2 rounded-full bg-white/90 text-primary shadow-md hover:bg-white transition-colors pointer-events-auto"
                    aria-label={translate("unitShare.title", "Share Property")}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Text Overlay Section */}
              <div className="absolute bottom-0 left-0 w-full bg-black/40 py-2 px-3 rounded-b-lg">
                <div className="flex items-center justify-between text-[12.5px] text-white font-semibold mb-1">
                  <div className="flex items-center gap-2 line-clamp-1">
                    <span className="text-[14px] font-bold">
                      {u.buildingType ? (
                        translate(
                          `buildingTypes.${String(u.buildingType).toLowerCase()}`,
                          String(u.buildingType)
                        )
                      ) : (allowMissingFields ? "—" : "Unit Type")}
                    </span>
                    <span className="text-[14px]">
                      {u.project
                        ? locale === "ar"
                          ? (u.project_ar || u.projectAr || u.ar_name || u.project)
                          : u.project.charAt(0).toUpperCase() +
                            u.project.slice(1).toLowerCase()
                        : allowMissingFields
                          ? "—"
                          : ""}
                    </span>
                  </div>
                  {u.code?.trim() && (
                    <span className="text-[11px] font-medium opacity-90 shrink-0">
                      {u.code}
                    </span>
                  )}
                </div>

                <div className="text-sm flex items-center justify-between text-white">
                  {u.purpose === "Rent" || u.purpose === "rent" ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="font-semibold text-[21px]">
                        {u.rentDurationType?.daily?.price && formatPrice(u.rentDurationType.daily.price)
                          ? `${formatPrice(u.rentDurationType.daily.price)} ${egpLabel}/day`
                          : u.rentDurationType?.weekly?.price && formatPrice(u.rentDurationType.weekly.price)
                            ? `${formatPrice(u.rentDurationType.weekly.price)} ${egpLabel}/week`
                            : u.rentDurationType?.monthly?.price && formatPrice(u.rentDurationType.monthly.price)
                              ? `${formatPrice(u.rentDurationType.monthly.price)} ${egpLabel}/month`
                              : u.rentPrice && formatPrice(u.rentPrice)
                                ? `${formatPrice(u.rentPrice)} ${egpLabel}`
                                : allowMissingFields
                                  ? "—"
                                  : t?.common?.na || "N/A"}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-[21px]">
                        {u.totalPrice != null && u.totalPrice !== "" && formatPrice(u.totalPrice)
                          ? `${formatPrice(u.totalPrice)} ${egpLabel}`
                          : allowMissingFields
                            ? "—"
                            : t?.common?.na || "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination && (
        <UnitsGridPagination
          nextCursor={pagination?.next_cursor}
          disableNext={!pagination?.has_more_next}
          previousCursor={pagination?.prev_cursor}
          disablePrev={!pagination?.has_more_prev}
        />
      )}

      <UnitShareLinksDialog
        isOpen={showShareDialog}
        onClose={() => {
          setShowShareDialog(false);
          setShareUnitCode(null);
        }}
        unitCode={shareUnitCode}
      />
    </>
  );
}
