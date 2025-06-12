"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export default function ImageSwiperModal({
  open,
  onClose,
  images = [],
  masterPlan = null,
  showMasterPlanLabel = true,
}) {
  if (!open) return null;

  // Compose images array with masterPlan as first if provided
  const allImages = [
    ...(masterPlan ? [{ url: masterPlan, isMasterPlan: true }] : []),
    ...images.map((img) => ({ ...img, isMasterPlan: false })),
  ];

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full h-full max-w-7xl max-h-screen">
        <Swiper
          modules={[Pagination]}
          spaceBetween={10}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true, type: "bullets" }}
          className="w-full h-full"
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
              />
              {showMasterPlanLabel && image.isMasterPlan && (
                <div className="fixed top-4 left-4 bg-black/60 text-white px-3 py-1 rounded">
                  Master Plan
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
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
