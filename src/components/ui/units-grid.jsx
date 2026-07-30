"use client";

import { useI18n } from "@/hooks/useI18n";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Share2 } from "lucide-react";

import ImageWithLoader from "@/components/ui/image-with-loader";
import UnitsGridPagination from "@/components/ui/units-grid-pagination";
import UnitShareLinksDialog from "@/components/unit-details/unit-share-links-dialog";
import {
  buildUnitDetailHrefFromListItem,
  resolveUnitCodeFromListItem,
} from "@/lib/units/unit-share-links";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  getUnitsSectionFromUrl,
  rememberUnitsListOrigin,
} from "@/utils/units-navigation-source";
import { useEffect, useState } from "react";
import {
  handleImageError,
  getFirstValidImage,
  getFallbackImage,
  getDisplayImageUrl,
} from "@/utils/imageUtils";
import EmptyStateVideo from "./empty-state-video";
import { useWhatsappBulkAccess } from "@/hooks/useWhatsappBulkAccess";
import { useUnitsBulkSelectionOptional } from "@/context/units-bulk-selection-context";
import {
  getUnitSelectionIdFromListItem,
} from "@/lib/units/unit-whatsapp-recipient";
import {
  canShowPresentValue,
  resolvePresentValue,
  resolvePricePerMeter,
} from "@/lib/units/present-value";

export default function UnitsGrid({
  units,
  pagination,
  readonly = false,
  allowMissingFields = false,
  /** When set (e.g. "?pending=1"), appended to unit detail links so details page can highlight missing fields */
  linkQueryParams = "",
  /**
   * TEMP: unit selection ids whose owner is a broker (from manual quick-search).
   * When provided, cards show a "Broker" badge. Units page does not pass this.
   * @type {Set<string> | null | undefined}
   */
  brokerUnitIds = null,
  /** When true, show presentValue + price/m² on secondary sale cards (filter toggle). */
  showPresentValue: showPresentValueProp = false,
}) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUnitCode, setShareUnitCode] = useState(null);
  const [shareListingClientId, setShareListingClientId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const { t, locale, translate, localeUtils } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showPresentValue =
    showPresentValueProp ||
    searchParams?.get?.("show_present_value") === "true";
  const clientId = LenaCookiesManager.getClientId();
  const { canShowBulkButton } = useWhatsappBulkAccess();
  const bulkSelection = useUnitsBulkSelectionOptional();
  const showBulkCheckbox = !readonly && isMounted && canShowBulkButton && bulkSelection;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const egpLabel = translate("currency.egp") || "EGP";

  const parsePrice = (price) => {
    if (price === null || price === undefined || price === "") return null;
    const n = typeof price === "number" ? price : Number(String(price).replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  };

  const formatPrice = (price) => {
    const n = parsePrice(price);
    if (n === null) return null;
    return localeUtils?.formatNumber ? localeUtils.formatNumber(n) : n.toLocaleString();
  };

  const getRentPeriodLabel = (period) =>
    translate(
      `rental.${period}`,
      period === "daily"
        ? locale === "ar"
          ? "يومي"
          : "day"
        : period === "weekly"
          ? locale === "ar"
            ? "أسبوعي"
            : "week"
          : locale === "ar"
            ? "شهري"
            : "month"
    );

  const formatRentPriceWithPeriod = (price, period) => {
    const n = parsePrice(price);
    // Rent cards: show monthly only when a real amount exists (0 = unset default).
    if (n === null || n <= 0) return null;
    const formatted = formatPrice(n);
    if (!formatted) return null;
    return `${formatted} ${egpLabel}/${getRentPeriodLabel(period)}`;
  };

  const getRentPriceLabel = (unit) => {
    // Flat monthlyRentPrice (fallback mirrored totalPrice during migration).
    return formatRentPriceWithPeriod(
      unit.monthlyRentPrice ?? unit.totalPrice,
      "monthly"
    );
  };

  const getUnitHref = (unit) =>
    buildUnitDetailHrefFromListItem(unit, {
      readonly,
      clientId,
      queryParams: linkQueryParams || "",
    });

  /**
   * Remember which list (with its current filters/search/pagination in the URL) the user
   * opened a unit from, so the edit flow can return here after a successful save.
   * Skipped for readonly/public grids, which have no edit flow.
   */
  const handleOpenUnit = () => {
    if (readonly) return;
    rememberUnitsListOrigin({
      url:
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : pathname,
      section: getUnitsSectionFromUrl(pathname, searchParams),
    });
  };

  const handleShareClick = (unit, e) => {
    e.preventDefault();
    e.stopPropagation();
    const normalizedCode = resolveUnitCodeFromListItem(unit);
    if (!normalizedCode) return;
    const listingId =
      (unit?.clientId != null && String(unit.clientId).trim()) ||
      (unit?.client_id != null && String(unit.client_id).trim()) ||
      clientId ||
      null;
    setShareUnitCode(normalizedCode);
    setShareListingClientId(listingId);
    setShowShareDialog(true);
  };

  return (
    <>
      {units.length === 0 ? (
        <EmptyStateVideo variant="units" autoPlay showControls loop />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-3 sm:mt-4 min-w-0">
          {units.map((u, idx) => {
            const unitHref = getUnitHref(u);
            const unitCode = resolveUnitCodeFromListItem(u);
            const cardKey = u.unitId ?? unitCode ?? idx;
            const unitSelectionId = getUnitSelectionIdFromListItem(u);
            const isSelected =
              showBulkCheckbox &&
              unitSelectionId &&
              bulkSelection.isUnitSelected(unitSelectionId);
            const showBrokerBadge =
              Boolean(brokerUnitIds) &&
              Boolean(unitSelectionId) &&
              brokerUnitIds.has(String(unitSelectionId));

            const cardBody = (
              <>
                {/* Image Section */}
                <div className="relative w-full aspect-[5/4] sm:aspect-auto sm:h-80 lg:h-92 overflow-hidden rounded-md shadow-lg bg-gray-100 isolate">
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
                  ) : u.image ? (
                    <ImageWithLoader
                      src={getDisplayImageUrl(String(u.image))}
                      alt={u.name || u.compound || t?.common?.property || "Property"}
                      className="w-full h-full object-cover"
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
                        className="absolute text-[14px] top-3 rounded-sm start-5 cursor-pointer bg-primary text-white px-2 capitalize"
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
                      {showBrokerBadge ? (
                        <p
                          style={{ fontWeight: "600" }}
                          className="absolute text-[12px] top-3 rounded-sm end-14 z-10 bg-amber-500 text-white px-2 py-0.5 uppercase tracking-wide shadow-sm"
                          aria-label={translate("ownerType.broker", "Broker")}
                        >
                          {translate("ownerType.broker", "Broker")}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* Text Overlay Section */}
                <div className="absolute bottom-0 inset-x-0 bg-black/40 py-2 px-3 rounded-b-lg">
                  <div className="flex items-center justify-between gap-2 text-[12.5px] text-white font-semibold mb-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 line-clamp-1">
                      <span className="text-[14px] font-bold shrink-0">
                        {u.buildingType || u.property_type ? (
                          translate(
                            `buildingTypes.${String(u.buildingType || u.property_type).toLowerCase()}`,
                            String(u.buildingType || u.property_type)
                          )
                        ) : (allowMissingFields ? "—" : "Unit Type")}
                      </span>
                      <span className="text-[14px] truncate min-w-0">
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
                    {unitCode && (
                      <span className="text-[11px] font-medium opacity-90 shrink-0">
                        {unitCode}
                      </span>
                    )}
                  </div>

                  <div className="text-sm flex items-center justify-between text-white min-w-0">
                    {u.purpose === "Rent" || u.purpose === "rent" ? (
                      <div className="flex items-center justify-between w-full min-w-0">
                        <div className="font-semibold text-base sm:text-lg lg:text-[21px] truncate">
                          {getRentPriceLabel(u) ||
                            (allowMissingFields
                              ? "—"
                              : t?.common?.na || "N/A")}
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const presentValue =
                          showPresentValue && canShowPresentValue(u)
                            ? resolvePresentValue(u)
                            : null;
                        const pricePerMeter =
                          presentValue != null ? resolvePricePerMeter(u) : null;
                        const askingLabel =
                          u.totalPrice != null &&
                          u.totalPrice !== "" &&
                          formatPrice(u.totalPrice)
                            ? `${formatPrice(u.totalPrice)} ${egpLabel}`
                            : allowMissingFields
                              ? "—"
                              : t?.common?.na || "N/A";

                        if (presentValue != null) {
                          return (
                            <div className="flex flex-col gap-0.5 w-full min-w-0">
                              <div className="flex items-baseline justify-between gap-2 min-w-0">
                                <span className="text-[10px] sm:text-[11px] font-medium opacity-90 shrink-0">
                                  {translate(
                                    "unitPricing.presentValue",
                                    "Present value"
                                  )}
                                </span>
                                <span className="font-semibold text-base sm:text-lg lg:text-[21px] truncate">
                                  {`${formatPrice(presentValue)} ${egpLabel}`}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between gap-2 min-w-0 text-[11px] sm:text-xs opacity-90">
                                <span className="shrink-0">
                                  {translate(
                                    "unitPricing.askingPrice",
                                    "Asking price"
                                  )}
                                </span>
                                <span className="truncate font-medium">
                                  {askingLabel}
                                </span>
                              </div>
                              {pricePerMeter != null && formatPrice(pricePerMeter) ? (
                                <div className="flex items-baseline justify-between gap-2 min-w-0 text-[11px] sm:text-xs opacity-90">
                                  <span className="shrink-0">
                                    {translate(
                                      "unitPricing.pricePerMeter",
                                      "Price / m²"
                                    )}
                                  </span>
                                  <span className="truncate font-medium">
                                    {`${formatPrice(pricePerMeter)} ${egpLabel}`}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          );
                        }

                        return (
                          <div className="flex items-center justify-between w-full min-w-0">
                            <span className="font-semibold text-base sm:text-lg lg:text-[21px] truncate">
                              {askingLabel}
                            </span>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              </>
            );

            return (
              <div
                key={cardKey}
                className={`relative ${isSelected ? "ring-2 ring-primary rounded-md" : ""}`}
              >
                {unitHref ? (
                  <Link
                    href={unitHref}
                    className="relative block"
                    onClick={handleOpenUnit}
                  >
                    {cardBody}
                  </Link>
                ) : (
                  <div className="relative block" aria-disabled="true">
                    {cardBody}
                  </div>
                )}

                {showBulkCheckbox && unitSelectionId && (
                  <label
                    className="absolute top-12 start-3 z-30 flex items-center justify-center min-h-10 min-w-10 p-2 rounded-md bg-white/90 shadow-md cursor-pointer hover:bg-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-primary rounded border-gray-300"
                      checked={Boolean(isSelected)}
                      aria-label={translate(
                        "unitsFilter.bulkAvailability.selectUnit",
                        "Select unit"
                      )}
                      onChange={(e) => {
                        e.stopPropagation();
                        bulkSelection.toggleUnitSelection(unitSelectionId);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                )}

                {unitCode && (
                  <button
                    type="button"
                    onClick={(e) => handleShareClick(u, e)}
                    className="absolute top-3 end-3 z-30 flex items-center justify-center min-h-10 min-w-10 p-2 rounded-full bg-white/90 text-primary shadow-md hover:bg-white transition-colors"
                    aria-label={translate("unitShare.title", "Share Property")}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
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
          setShareListingClientId(null);
        }}
        unitCode={shareUnitCode}
        listingClientId={shareListingClientId}
      />
    </>
  );
}
