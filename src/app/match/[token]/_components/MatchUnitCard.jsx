"use client";

import ImageWithLoader from "@/components/ui/image-with-loader";
import ImageSwiperModal from "@/components/ui/images-swiper-modal";
import { useI18n } from "@/hooks/useI18n";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { formatCurrency } from "@/utils/formatters";
import { Bath, Bed, Heart, MapPin, Square } from "lucide-react";
import { useState } from "react";

const MAX_IMAGES = 4;

function getUnitId(unit) {
  return unit?.unitId || unit?.unit_id || unit?.id || "";
}

function getImages(unit) {
  const raw = unit?.images;
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_IMAGES).map((img) => ({
    url: getDisplayImageUrl(typeof img === "string" ? img : img?.url),
    alt: typeof img === "object" ? img?.alt || "Unit" : "Unit",
  }));
}

export default function MatchUnitCard({
  unit,
  liked,
  selected,
  onToggleLike,
  onToggleSelect,
  savingLike,
}) {
  const { translate } = useI18n();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const unitId = getUnitId(unit);
  const images = getImages(unit);
  const title =
    unit?.unitTitle ||
    unit?.unit_title ||
    unit?.title ||
    translate("matchPage.unitFallback", "Property unit");

  const city = unit?.city || "";
  const project = unit?.project || unit?.project_name || "";
  const price = unit?.totalPrice ?? unit?.total_price;
  const rooms = unit?.roomsCount ?? unit?.bedrooms;
  const baths = unit?.bathroomCount ?? unit?.bathrooms;
  const area = unit?.landArea ?? unit?.land_area;

  const openGallery = (index) => {
    setGalleryStartIndex(index);
    setGalleryOpen(true);
  };

  return (
    <article className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0.5 bg-gray-100">
        {images.length > 0 ? (
          images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => openGallery(idx)}
              className="relative aspect-[4/3] bg-gray-200 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={translate("matchPage.viewImage", "View full image")}
            >
              <ImageWithLoader
                src={img.url}
                alt={img.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))
        ) : (
          <div className="col-span-2 sm:col-span-4 aspect-[16/7] flex items-center justify-center text-xs text-gray-400">
            {translate("matchPage.noImages", "No images")}
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{title}</h3>
            {(project || city) && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span className="truncate">
                  {[project, city].filter(Boolean).join(" • ")}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onToggleLike?.(unitId)}
            disabled={savingLike}
            className={`shrink-0 p-2 rounded-full border transition-colors ${
              liked
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-white border-gray-200 text-gray-400 hover:text-red-500"
            }`}
            aria-label={
              liked
                ? translate("matchPage.unlike", "Unlike")
                : translate("matchPage.like", "Like")
            }
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          {rooms != null && (
            <span className="inline-flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" />
              {rooms}
            </span>
          )}
          {baths != null && (
            <span className="inline-flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              {baths}
            </span>
          )}
          {area != null && (
            <span className="inline-flex items-center gap-1">
              <Square className="w-3.5 h-3.5" />
              {area} m²
            </span>
          )}
          {price != null && (
            <span className="font-semibold text-primary ms-auto">
              {formatCurrency(price)}
            </span>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(unitId)}
            className="h-4 w-4 accent-primary rounded border-gray-300"
          />
          {translate("matchPage.selectForViewing", "Select for viewing")}
        </label>
      </div>

      <ImageSwiperModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={images.map((img) => ({ url: img.url, alt: img.alt }))}
        showMasterPlanLabel={false}
        initialSlide={galleryStartIndex}
      />
    </article>
  );
}
