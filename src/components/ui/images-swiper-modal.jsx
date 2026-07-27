"use client";

import ZoomableImage from "@/components/ui/zoomable-image";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { useI18n } from "@/hooks/useI18n";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "swiper/css";
import { Keyboard, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export default function ImageSwiperModal({
  open,
  onClose,
  images = [],
  masterPlan = null,
  showMasterPlanLabel = true,
  initialSlide = 0,
}) {
  const { translate } = useI18n();
  const [activeIndex, setActiveIndex] = useState(initialSlide);
  const [scale, setScale] = useState(1);
  const [swiperInstance, setSwiperInstance] = useState(null);

  useEffect(() => {
    if (open) {
      setActiveIndex(initialSlide);
      setScale(1);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open, initialSlide]);

  useEffect(() => {
    if (!swiperInstance) return;
    swiperInstance.allowTouchMove = scale <= 1;
  }, [scale, swiperInstance]);

  const handleScaleChange = useCallback((nextScale) => {
    setScale(nextScale);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const allImages = [
    ...(masterPlan ? [{ url: masterPlan, isMasterPlan: true }] : []),
    ...images.map((img) =>
      typeof img === "string"
        ? { url: img, isMasterPlan: false }
        : { ...img, isMasterPlan: Boolean(img?.isMasterPlan) }
    ),
  ];

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={translate("imageViewer.title", "Image viewer")}
    >
      <div
        className="relative p-4 w-[95%] h-[90vh] max-w-7xl max-h-screen bg-white rounded-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 shrink-0 mb-2">
          <button
            type="button"
            onClick={onClose}
            aria-label={translate("common.close", "Close")}
            className="p-1.5 rounded-full text-black hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
          {allImages.length > 1 && (
            <span className="text-sm text-gray-600">
              {activeIndex + 1} / {allImages.length}
            </span>
          )}
        </div>

        <div className="flex-1 relative min-h-0">
          <Swiper
            modules={[Keyboard, Navigation]}
            initialSlide={initialSlide}
            slidesPerView={1}
            spaceBetween={10}
            loop={false}
            navigation={{
              nextEl: ".image-viewer-next",
              prevEl: ".image-viewer-prev",
            }}
            keyboard={{ enabled: true }}
            className="w-full h-full"
            onSwiper={setSwiperInstance}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.activeIndex);
              setScale(1);
            }}
          >
            {allImages.map((image, index) => (
              <SwiperSlide
                key={`${image.url}-${index}`}
                className="!flex items-center justify-center"
              >
                <ZoomableImage
                  src={getDisplayImageUrl(image.url) || "/images/defaultImage.jpg"}
                  alt={
                    image.alt ||
                    translate("imageViewer.imageAlt", "Gallery image {n}").replace(
                      "{n}",
                      String(index + 1)
                    )
                  }
                  priority={index === 0}
                  sizes="90vw"
                  resetToken={activeIndex}
                  onScaleChange={index === activeIndex ? handleScaleChange : undefined}
                />
                {showMasterPlanLabel && image.isMasterPlan && (
                  <div className="absolute top-4 start-4 bg-black/60 text-white px-3 py-1 rounded z-10 pointer-events-none">
                    {translate("imageViewer.masterPlan", "Master Plan")}
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>

          {allImages.length > 1 && (
            <>
              <button
                type="button"
                className={`image-viewer-prev absolute start-3 top-1/2 -translate-y-1/2 z-20 bg-black/70 text-white p-1.5 rounded-full transition ${
                  activeIndex === 0 || scale > 1
                    ? "opacity-40 !cursor-auto"
                    : "hover:bg-primary"
                }`}
                disabled={activeIndex === 0 || scale > 1}
                aria-label={translate("common.previous", "Previous")}
              >
                <ChevronLeft size={26} />
              </button>
              <button
                type="button"
                className={`image-viewer-next absolute end-3 top-1/2 -translate-y-1/2 z-20 bg-black/70 text-white p-1.5 rounded-full transition ${
                  activeIndex === allImages.length - 1 || scale > 1
                    ? "opacity-40 !cursor-auto"
                    : "hover:bg-primary"
                }`}
                disabled={activeIndex === allImages.length - 1 || scale > 1}
                aria-label={translate("common.next", "Next")}
              >
                <ChevronRight size={26} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
