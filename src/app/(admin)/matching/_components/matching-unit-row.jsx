"use client";

import ImageWithLoader from "@/components/ui/image-with-loader";
import { useI18n } from "@/hooks/useI18n";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { formatPrice } from "@/utils/parse-amount";
import {
  buildUnitDetailHrefFromListItem,
  resolveUnitCodeFromListItem,
} from "@/lib/units/unit-share-links";
import {
  isRentPurpose,
  resolveUnitDisplayPrice,
} from "@/lib/units/unit-price";
import { getMatchingUnitId } from "@/lib/matching/unit-recommendation-service";
import { Bed, Square, X } from "lucide-react";
import Link from "next/link";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";

function toPositiveNumber(value) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export default function MatchingUnitRow({
  unit,
  showDismiss = false,
  onDismiss,
  clientId: clientIdProp,
}) {
  const { translate } = useI18n();
  const clientId = clientIdProp || LenaCookiesManager.getClientId();
  const code = resolveUnitCodeFromListItem(unit);
  const unitId = getMatchingUnitId(unit);
  const href = buildUnitDetailHrefFromListItem(unit, { clientId });
  const imageRaw = Array.isArray(unit?.images) ? unit.images[0] : null;
  const imageUrl = getDisplayImageUrl(
    typeof imageRaw === "string" ? imageRaw : imageRaw?.url,
  );
  const price = resolveUnitDisplayPrice(unit);
  const priceLabel =
    price != null && formatPrice(price) ? formatPrice(price) : null;
  const down =
    toPositiveNumber(unit?.downPayment) ??
    toPositiveNumber(unit?.down_payment);
  const area =
    toPositiveNumber(unit?.landArea) ?? toPositiveNumber(unit?.area);
  const bedrooms = unit?.roomsCount ?? unit?.bedrooms;
  const project = unit?.project || "";
  const district = unit?.district || "";
  const egp = translate("common.egp", "EGP");

  return (
    <div className="flex items-stretch gap-3 rounded-md border border-gray-200 bg-white p-2">
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded bg-gray-100">
        {imageUrl ? (
          <ImageWithLoader
            src={imageUrl}
            alt={code || "unit"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gray-100" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {href ? (
              <Link
                href={href}
                className="text-sm font-semibold text-primary hover:underline truncate block"
                target="_blank"
                rel="noopener noreferrer"
              >
                {code || unitId}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-gray-900 truncate">
                {code || unitId}
              </p>
            )}
            <p className="text-xs text-gray-500 truncate">
              {[project, district].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          {showDismiss && (
            <button
              type="button"
              onClick={() => onDismiss?.(unitId)}
              className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label={translate("matching.actions.dismissUnit")}
              title={translate("matching.actions.dismissUnit")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
          {bedrooms != null && bedrooms !== "" && (
            <span className="inline-flex items-center gap-1">
              <Bed className="h-3 w-3" />
              {bedrooms}
            </span>
          )}
          {area != null && (
            <span className="inline-flex items-center gap-1">
              <Square className="h-3 w-3" />
              {area} m²
            </span>
          )}
          {priceLabel && (
            <span>
              {isRentPurpose(unit?.purpose)
                ? translate("units.monthly", "Monthly")
                : translate("units.price", "Price")}
              : {priceLabel} {egp}
            </span>
          )}
          {down != null && formatPrice(down) && (
            <span>
              {translate("units.downPayment", "Down payment")}:{" "}
              {formatPrice(down)} {egp}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
