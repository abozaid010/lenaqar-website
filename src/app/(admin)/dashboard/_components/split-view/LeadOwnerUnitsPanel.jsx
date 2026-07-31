"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bed, Eye, Pencil, Square } from "lucide-react";
import ImageWithLoader from "@/components/ui/image-with-loader";
import ImageSwiperModal from "@/components/ui/images-swiper-modal";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { useI18n } from "@/hooks/useI18n";
import { useUnitsByOwnerPhone } from "@/hooks/use-units-by-owner-phone";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { formatCurrency } from "@/utils/formatters";
import {
  buildAdminUnitEditPath,
  buildUnitDetailHrefFromListItem,
  resolveUnitCodeFromListItem,
  resolveUnitIdFromListItem,
} from "@/lib/units/unit-share-links";
import {
  isRentPurpose,
  resolveUnitDisplayPrice,
} from "@/lib/units/unit-price";
import { formatFurnishing, formatPurpose } from "@/lib/units/unit-formatters";

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

function getOwnerUnitCardModel(unit, t, clientId, translate) {
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
  const purpose = formatPurpose(unit?.purpose, t);
  const project = unit?.project || "";
  const district = unit?.district || "";
  const priceLabel = isRentPurpose(unit?.purpose)
    ? translate("rentalDetails.monthlyRentPrice", "Monthly rent")
    : translate("saleDetails.totalPrice", "Price");
  const listingClientId =
    (unit?.clientId != null && String(unit.clientId).trim()) ||
    (unit?.client_id != null && String(unit.client_id).trim()) ||
    clientId ||
    null;
  const editHref = code
    ? buildAdminUnitEditPath(code, listingClientId)
    : null;
  const detailHref = buildUnitDetailHrefFromListItem(unit, {
    clientId: listingClientId,
  });
  return {
    code,
    thumb,
    price,
    area,
    bedrooms,
    furnishing,
    purpose,
    project,
    district,
    priceLabel,
    editHref,
    detailHref,
  };
}

function OwnerUnitCard({ unit, onPreview, translate, t, clientId }) {
  const {
    code,
    thumb,
    price,
    area,
    bedrooms,
    furnishing,
    project,
    district,
    priceLabel,
    editHref,
  } = getOwnerUnitCardModel(unit, t, clientId, translate);

  return (
    <div className="flex w-full items-stretch gap-3 rounded-lg border border-gray-200 bg-white p-2.5 transition-colors hover:border-primary/40 hover:bg-primary/[0.02]">
      <button
        type="button"
        onClick={() => onPreview(unit)}
        className="flex min-w-0 flex-1 items-stretch gap-3 text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-md"
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
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">
              {code || getUnitKey(unit) || "—"}
            </p>
            <p className="truncate text-xs text-gray-500">
              {[project, district].filter(Boolean).join(" · ") || "—"}
            </p>
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

      <div className="flex shrink-0 flex-col items-stretch justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onPreview(unit)}
          className="inline-flex items-center justify-center gap-1 rounded-md bg-primary/5 px-2 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          title={translate("leadDetail.ownerUnits.preview", "Preview")}
          aria-label={translate("leadDetail.ownerUnits.preview", "Preview")}
        >
          <Eye className="h-3 w-3" aria-hidden />
          <span>{translate("leadDetail.ownerUnits.preview", "Preview")}</span>
        </button>
        {editHref ? (
          <Link
            href={editHref}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-700 hover:border-primary/40 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            title={translate("leadDetail.ownerUnits.edit", "Edit")}
            aria-label={translate("leadDetail.ownerUnits.edit", "Edit")}
          >
            <Pencil className="h-3 w-3" aria-hidden />
            <span>{translate("leadDetail.ownerUnits.edit", "Edit")}</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** Compact card for horizontal scroll strip in the unified lead detail. */
function OwnerUnitCardHorizontal({ unit, onPreview, translate, t, clientId }) {
  const {
    code,
    thumb,
    price,
    area,
    bedrooms,
    furnishing,
    purpose,
    project,
    district,
    editHref,
    detailHref,
  } = getOwnerUnitCardModel(unit, t, clientId, translate);

  const codeLabel = code || getUnitKey(unit) || "—";
  const openDetailsLabel = translate(
    "leadDetail.ownerUnits.openDetails",
    "Open unit details",
  );

  return (
    <div className="flex w-[168px] shrink-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors hover:border-primary/40">
      <button
        type="button"
        onClick={() => onPreview(unit)}
        className="relative h-20 w-full overflow-hidden bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
        aria-label={translate("leadDetail.ownerUnits.preview", "Preview")}
      >
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
        {(purpose || furnishing) && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap gap-1 p-1">
            {purpose ? (
              <span className="max-w-full truncate rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-medium leading-tight text-white">
                {purpose}
              </span>
            ) : null}
            {furnishing ? (
              <span className="max-w-full truncate rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-medium leading-tight text-white">
                {furnishing}
              </span>
            ) : null}
          </div>
        )}
      </button>

      <div className="space-y-0.5 p-2">
        {detailHref ? (
          <Link
            href={detailHref}
            className="block truncate text-xs font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm"
            title={openDetailsLabel}
            aria-label={`${openDetailsLabel}: ${codeLabel}`}
          >
            {codeLabel}
          </Link>
        ) : (
          <p className="truncate text-xs font-semibold text-gray-800">
            {codeLabel}
          </p>
        )}
        <p className="truncate text-[10px] text-gray-500">
          {[project, district].filter(Boolean).join(" · ") || "—"}
        </p>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-gray-600">
          {price != null && (
            <span className="font-semibold text-gray-900">
              {formatCurrency(price)}
            </span>
          )}
          {bedrooms != null && bedrooms !== "" && (
            <span className="inline-flex items-center gap-0.5">
              <Bed className="h-2.5 w-2.5" aria-hidden />
              {bedrooms}
            </span>
          )}
          {area != null && (
            <span className="inline-flex items-center gap-0.5">
              <Square className="h-2.5 w-2.5" aria-hidden />
              {area} m²
            </span>
          )}
        </div>
      </div>

      {editHref ? (
        <Link
          href={editHref}
          className="flex items-center justify-center gap-1 border-t border-gray-100 px-2 py-1.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50 hover:text-primary"
          title={translate("leadDetail.ownerUnits.edit", "Edit")}
          aria-label={translate("leadDetail.ownerUnits.edit", "Edit")}
        >
          <Pencil className="h-2.5 w-2.5" aria-hidden />
          {translate("leadDetail.ownerUnits.edit", "Edit")}
        </Link>
      ) : null}
    </div>
  );
}

function OwnerUnitPreviewDialog({ unit, isOpen, onClose, translate, t, clientId }) {
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
  const listingClientId =
    (unit?.clientId != null && String(unit.clientId).trim()) ||
    (unit?.client_id != null && String(unit.client_id).trim()) ||
    clientId ||
    null;
  const editHref = code
    ? buildAdminUnitEditPath(code, listingClientId)
    : null;

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
        headerTrailing={
          editHref ? (
            <Link
              href={editHref}
              className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-white/90"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {translate("leadDetail.ownerUnits.edit", "Edit")}
            </Link>
          ) : (
            <span className="w-16" aria-hidden />
          )
        }
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
 *
 * @param {"stack"|"horizontal"} variant — stack = full list; horizontal = compact scroll strip
 */
export default function LeadOwnerUnitsPanel({ phone, variant = "stack" }) {
  const { translate, t } = useI18n();
  const clientId = LenaCookiesManager.getClientId();
  const { units, isLoading, isError, refetch } = useUnitsByOwnerPhone(phone);
  const [previewUnit, setPreviewUnit] = useState(null);
  const isHorizontal = variant === "horizontal";

  if (!phone) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white text-center ${
          isHorizontal ? "px-3 py-2" : "p-4"
        }`}
      >
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
      <div
        className={`flex items-center justify-center rounded-lg border border-gray-200 bg-white ${
          isHorizontal ? "py-6" : "py-12"
        }`}
      >
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
    <div
      className={`rounded-lg border border-gray-200 bg-white ${
        isHorizontal ? "p-2 sm:p-2.5 space-y-2" : "p-3 sm:p-4 space-y-3"
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-0.5">
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
        <p
          className={`text-sm text-gray-500 text-center ${
            isHorizontal ? "py-2" : "py-4"
          }`}
        >
          {translate(
            "leadDetail.ownerUnits.empty",
            "No units found for this owner phone.",
          )}
        </p>
      ) : isHorizontal ? (
        <div className="-mx-0.5 flex gap-2 overflow-x-auto overscroll-x-contain px-0.5 pb-0.5 [scrollbar-width:thin]">
          {units.map((unit) => (
            <OwnerUnitCardHorizontal
              key={getUnitKey(unit) || JSON.stringify(unit?.code)}
              unit={unit}
              onPreview={setPreviewUnit}
              translate={translate}
              t={t}
              clientId={clientId}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {units.map((unit) => (
            <OwnerUnitCard
              key={getUnitKey(unit) || JSON.stringify(unit?.code)}
              unit={unit}
              onPreview={setPreviewUnit}
              translate={translate}
              t={t}
              clientId={clientId}
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
        clientId={clientId}
      />
    </div>
  );
}
