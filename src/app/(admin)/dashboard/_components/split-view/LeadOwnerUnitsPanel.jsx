"use client";

import { useMemo, useState } from "react";
import { Bed, Eye, Square } from "lucide-react";
import ImageWithLoader from "@/components/ui/image-with-loader";
import ImageSwiperModal from "@/components/ui/images-swiper-modal";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { useI18n } from "@/hooks/useI18n";
import { useUnitsByOwnerPhone } from "@/hooks/use-units-by-owner-phone";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { formatCurrency } from "@/utils/formatters";
import {
  resolveUnitCodeFromListItem,
  resolveUnitIdFromListItem,
} from "@/lib/units/unit-share-links";
import {
  isRentPurpose,
  resolveUnitDisplayPrice,
} from "@/lib/units/unit-price";
import { formatFurnishing } from "@/lib/units/unit-formatters";

function toPositiveNumber(value) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function getUnitKey(unit) {
  return (
    resolveUnitIdFromListItem(unit) ||
    resolveUnitCodeFromListItem(unit) ||
    null
  );
}

function getUnitImages(unit) {
  const raw = unit?.images;
  if (!Array.isArray(raw) || raw.length === 0) {
    if (unit?.image) {
      return [
        {
          url: getDisplayImageUrl(unit.image),
          alt: resolveUnitCodeFromListItem(unit) || "Unit",
        },
      ];
    }
    return [];
  }
  return raw
    .map((img) => ({
      url: getDisplayImageUrl(typeof img === "string" ? img : img?.url),
      alt:
        (typeof img === "object" && img?.alt) ||
        resolveUnitCodeFromListItem(unit) ||
        "Unit",
    }))
    .filter((img) => Boolean(img.url));
}

function OwnerUnitCard({ unit, onPreview, translate, t }) {
  const code = resolveUnitCodeFromListItem(unit);
  const images = getUnitImages(unit);
  const thumb = images[0]?.url;
  const price = resolveUnitDisplayPrice(unit);
  const area =
    toPositiveNumber(unit?.landArea) ?? toPositiveNumber(unit?.area);
  const bedrooms = unit?.roomsCount ?? unit?.bedrooms;
  const furnishing = formatFurnishing(
    unit?.furnishing ?? unit?.furnishingType,
    t,
  );
  const project = unit?.project || "";
  const district = unit?.district || "";
  const priceLabel = isRentPurpose(unit?.purpose)
    ? translate("rentalDetails.monthlyRentPrice", "Monthly rent")
    : translate("saleDetails.totalPrice", "Price");

  return (
    <button
      type="button"
      onClick={() => onPreview(unit)}
      className="flex w-full items-stretch gap-3 rounded-lg border border-gray-200 bg-white p-2.5 text-start transition-colors hover:border-primary/40 hover:bg-primary/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100">
        {thumb ? (
          <ImageWithLoader
            src={thumb}
            alt={code || "unit"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
            {translate("matchPage.noImages", "No images")}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">
              {code || getUnitKey(unit) || "—"}
            </p>
            <p className="truncate text-xs text-gray-500">
              {[project, district].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/5 px-1.5 py-0.5 text-[11px] font-medium text-primary">
            <Eye className="h-3 w-3" aria-hidden />
            {translate("leadDetail.ownerUnits.preview", "Preview")}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
          {price != null && (
            <span>
              {priceLabel}:{" "}
              <span className="font-semibold text-gray-900">
                {formatCurrency(price)}
              </span>
            </span>
          )}
          {bedrooms != null && bedrooms !== "" && (
            <span className="inline-flex items-center gap-1">
              <Bed className="h-3 w-3" aria-hidden />
              {bedrooms}
            </span>
          )}
          {area != null && (
            <span className="inline-flex items-center gap-1">
              <Square className="h-3 w-3" aria-hidden />
              {area} m²
            </span>
          )}
          {furnishing && <span className="truncate">{furnishing}</span>}
        </div>
      </div>
    </button>
  );
}

function OwnerUnitPreviewDialog({ unit, isOpen, onClose, translate, t }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const images = useMemo(() => (unit ? getUnitImages(unit) : []), [unit]);
  const code = unit ? resolveUnitCodeFromListItem(unit) : "";
  const price = unit ? resolveUnitDisplayPrice(unit) : null;
  const area =
    toPositiveNumber(unit?.landArea) ?? toPositiveNumber(unit?.area);
  const bedrooms = unit?.roomsCount ?? unit?.bedrooms;
  const furnishing = formatFurnishing(
    unit?.furnishing ?? unit?.furnishingType,
    t,
  );
  const priceLabel = isRentPurpose(unit?.purpose)
    ? translate("rentalDetails.monthlyRentPrice", "Monthly rent")
    : translate("saleDetails.totalPrice", "Price");

  const rows = [
    {
      key: "code",
      label: translate("leadDetail.ownerUnits.fields.code", "Code"),
      value: code || "—",
    },
    {
      key: "price",
      label: priceLabel,
      value: price != null ? formatCurrency(price) : null,
    },
    {
      key: "area",
      label: translate("leadDetail.ownerUnits.fields.area", "Area"),
      value: area != null ? `${area} m²` : null,
    },
    {
      key: "bedrooms",
      label: translate("leadDetail.ownerUnits.fields.bedrooms", "Bedrooms"),
      value: bedrooms != null && bedrooms !== "" ? String(bedrooms) : null,
    },
    {
      key: "furnishing",
      label: translate("leadDetail.ownerUnits.fields.furnishing", "Furnishing"),
      value: furnishing,
    },
    {
      key: "project",
      label: translate("leadDetail.ownerUnits.fields.project", "Project"),
      value: unit?.project || null,
    },
    {
      key: "district",
      label: translate("leadDetail.ownerUnits.fields.district", "District"),
      value: unit?.district || null,
    },
  ].filter((row) => row.value);

  return (
    <>
      <UnifiedDialog
        isOpen={isOpen && Boolean(unit)}
        onClose={onClose}
        title={
          code
            ? translate("leadDetail.ownerUnits.previewTitle", "Unit {code}").replace(
                "{code}",
                code,
              )
            : translate("leadDetail.ownerUnits.preview", "Preview")
        }
        cancelLabel={translate("common.close", "Close")}
        onCancel={onClose}
        headerTrailing={<span className="w-16" aria-hidden />}
        closeOnEscape
        closeOnOutsideClick
        dialogClassName="max-w-lg"
        bodyClassName="space-y-4"
      >
        {images[0]?.url ? (
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="relative block h-44 w-full overflow-hidden rounded-lg bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label={translate("matchPage.viewImage", "View full image")}
          >
            <ImageWithLoader
              src={images[0].url}
              alt={code || "unit"}
              className="h-full w-full object-cover"
            />
          </button>
        ) : null}

        <dl className="grid grid-cols-2 gap-3">
          {rows.map((row) => (
            <div key={row.key} className="min-w-0">
              <dt className="text-[11px] text-gray-500">{row.label}</dt>
              <dd className="truncate text-sm font-medium text-gray-900">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </UnifiedDialog>

      {galleryOpen && images.length > 0 && (
        <ImageSwiperModal
          open={galleryOpen}
          images={images}
          initialSlide={0}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
}

/**
 * Listed units for supply-side leads (owner / seller / renter).
 * Uses existing GET /units/by-owner-phone via useUnitsByOwnerPhone.
 */
export default function LeadOwnerUnitsPanel({ phone }) {
  const { translate, t } = useI18n();
  const { units, isLoading, isError, refetch } = useUnitsByOwnerPhone(phone);
  const [previewUnit, setPreviewUnit] = useState(null);

  if (!phone) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
        <p className="text-sm text-gray-500">
          {translate(
            "leadDetail.ownerUnits.noPhone",
            "This lead has no phone number to look up listed units.",
          )}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center space-y-2">
        <p className="text-sm text-red-600">
          {translate(
            "leadDetail.ownerUnits.loadFailed",
            "Unable to load listed units.",
          )}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs font-medium text-primary hover:underline"
        >
          {translate("common.retry", "Retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {translate("leadDetail.ownerUnits.title", "Listed units")}
        </h4>
        <span className="text-xs text-gray-500">
          {translate("leadDetail.ownerUnits.count", "{count} units").replace(
            "{count}",
            String(units.length),
          )}
        </span>
      </div>

      {units.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          {translate(
            "leadDetail.ownerUnits.empty",
            "No units found for this owner phone.",
          )}
        </p>
      ) : (
        <div className="space-y-2">
          {units.map((unit) => (
            <OwnerUnitCard
              key={getUnitKey(unit) || JSON.stringify(unit?.code)}
              unit={unit}
              onPreview={setPreviewUnit}
              translate={translate}
              t={t}
            />
          ))}
        </div>
      )}

      <OwnerUnitPreviewDialog
        unit={previewUnit}
        isOpen={Boolean(previewUnit)}
        onClose={() => setPreviewUnit(null)}
        translate={translate}
        t={t}
      />
    </div>
  );
}
