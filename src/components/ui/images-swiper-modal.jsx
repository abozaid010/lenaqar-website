"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
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
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!open) return null;

  // Compose images array with masterPlan as first if provided
  const allImages = [
    ...(masterPlan ? [{ url: masterPlan, isMasterPlan: true }] : []),
    ...images.map((img) => ({ ...img, isMasterPlan: false })),
  ];

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-[85%] h-full max-w-5xl max-h-screen">
        <Swiper
          modules={[Keyboard, Navigation]}
          slidesPerView={1}
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
              <Image
                src={image.url || "/images/defaultImage.jpg"}
                alt={`Project Image ${index + 1}`}
                fill
                objectFit="contain"
                className="bg-stone-50"
              />
              {showMasterPlanLabel && image.isMasterPlan && (
                <div className="fixed top-4 left-4 bg-black/60 text-white px-3 py-1 rounded">
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
              className={`custom-swiper-prev absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/70 text-white p-2 rounded-full transition
                ${activeIndex === 0 ? "opacity-40 !cursor-auto" : "hover:bg-primary"}`}
              disabled={activeIndex === 0}
            >
              <ChevronLeft size={28} />
            </button>
            <button
              className={`custom-swiper-next absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/70 text-white p-2 rounded-full transition
                ${activeIndex === allImages.length - 1 ? "opacity-40 !cursor-auto" : "hover:bg-primary"}`}
              disabled={activeIndex === allImages.length - 1}
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="fixed top-6 right-6 text-white bg-black bg-opacity-50 p-1.5 rounded-full hover:bg-opacity-70 transition-colors z-50 hover:text-white/80"
        >
          <X />
        </button>
      </div>
    </div>,
    document.body
  );
}
