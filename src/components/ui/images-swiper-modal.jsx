"use client";

import ImageWithLoader from "@/components/ui/image-with-loader";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [activeIndex, setActiveIndex] = useState(initialSlide);

  useEffect(() => {
    if (open) {
      setActiveIndex(initialSlide);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open, initialSlide]);

  if (!open) return null;

  // Compose images array with masterPlan as first if provided
  const allImages = [
    ...(masterPlan ? [{ url: masterPlan, isMasterPlan: true }] : []),
    ...images.map((img) => ({ ...img, isMasterPlan: false })),
  ];

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
    >
      <div className="relative p-4 w-[85%] h-[85vh] max-w-7xl max-h-screen bg-white rounded-lg overflow-hidden flex flex-col">
        <X
          size={26}
          onClick={onClose}
          className="cursor-pointer text-black hover:text-black/80"
        />

        <div className="flex-1 my-3 relative">
          <Swiper
            modules={[Keyboard, Navigation]}
            initialSlide={initialSlide}
            slidesPerView={1}
            spaceBetween={10}
            loop={false}
            navigation={{
              nextEl: ".custom-swiper-next",
              prevEl: ".custom-swiper-prev",
            }}
            keyboard={{ enabled: true }}
            className="w-full h-full"
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          >
            {allImages.map((image, index) => (
              <SwiperSlide
                key={index}
                className="flex items-center justify-center"
              >
                <ImageWithLoader
                  src={getDisplayImageUrl(image.url) || "/images/defaultImage.jpg"}
                  alt={`Project Image ${index + 1}`}
                  className="w-full h-full object-contain bg-stone-100 rounded-lg"
                  priority={index === 0} // Load first image with priority
                  loadingVariant="default"
                  sizes="90vw"
                />
                {showMasterPlanLabel && image.isMasterPlan && (
                  <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded z-10">
                    Master Plan
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Arrows with Lucide and disabled state */}
          {allImages.length > 1 && (
            <>
              <button
                className={`custom-swiper-prev absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/70 text-white p-1 rounded-full transition
                ${activeIndex === 0 ? "opacity-40 !cursor-auto" : "hover:bg-primary"}`}
                disabled={activeIndex === 0}
              >
                <ChevronLeft size={26} />
              </button>
              <button
                className={`custom-swiper-next absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/70 text-white p-1 rounded-full transition
                ${activeIndex === allImages.length - 1 ? "opacity-40 !cursor-auto" : "hover:bg-primary"}`}
                disabled={activeIndex === allImages.length - 1}
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
