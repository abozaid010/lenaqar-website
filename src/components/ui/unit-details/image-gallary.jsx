"use client";

import ImageWithLoader from "@/components/ui/image-with-loader";
import ImageSwiperModal from "@/components/ui/images-swiper-modal";
import ShareModal from "@/components/ui/units-share-modal";
import { getShareUnitData } from "@/utils/api";
import { useState } from "react";
import toast from "react-hot-toast";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import { Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import shareButton from "../../../../public/share.svg";

export default function ImageGallary({ images, unitName, unitId, readOnly }) {
  const [showModal, setShowModal] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [loadingShare, setLoadingShare] = useState(false);

  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleShareClick = async (e) => {
    if (!unitId) {
      toast.error("Unit ID is not available.");
    }
    e.preventDefault();
    e.stopPropagation();

    setShowModal(true);
    setLoadingShare(true);

    try {
      const data = await getShareUnitData(unitId);
      setShareData(data);
    } catch (error) {
      console.error("Error fetching share data:", error);
      setShareData(null);
    } finally {
      setLoadingShare(false);
    }
  };

  return (
    <div className="space-y-2 w-full md:w-1/2 xl:w-2/5">
      <div
        className="relative h-[600px] w-full rounded-md overflow-hidden cursor-pointer shadow-lg group"
        onClick={() => setIsFullscreen(true)}
      >
        <ImageWithLoader
          src={images[mainImageIndex].url || "/images/defaultImage.jpg"}
          onError={(e) => {
            e.currentTarget.src = "/images/defaultImage.jpg";
            e.currentTarget.onerror = null;
          }}
          priority={true}
          alt={`${unitName}`}
          className="w-full h-full object-cover rounded-md transition-transform duration-300 group-hover:scale-[1.02]"
          loadingVariant="default"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end">
          <div className="flex items-center gap-2 text-white mb-4 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span>Click to view in fullscreen</span>
          </div>
        </div>

        {/* Share Button */}
        {!readOnly && (
          <button
            type="button"
            onClick={handleShareClick}
            className="absolute top-3 left-2 cursor-pointer p-2.5  "
          >
            <img src={shareButton.src} alt="share" />
          </button>
        )}
      </div>

      {/* Thumbnail swiper */}
      <Swiper
        modules={[Navigation, Thumbs]}
        spaceBetween={8}
        slidesPerView={4}
        navigation
        watchSlidesProgress
        className="swiper-thumbs"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div
              className={`relative h-20 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                mainImageIndex === index
                  ? "ring-2 ring-primary scale-95 shadow-md"
                  : "hover:ring-1 hover:ring-primary/50"
              }`}
              onClick={() => setMainImageIndex(index)}
            >
              <ImageWithLoader
                src={image.url || "/images/defaultImage.jpg"}
                onError={(e) => {
                  e.currentTarget.src = "/images/defaultImage.jpg";
                  e.currentTarget.onerror = null;
                }}
                alt={`Unit - ${index + 1}`}
                className="w-full h-full object-cover"
                priority={false}
                loadingVariant="minimal"
                sizes="120px"
              />
              {mainImageIndex === index && (
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-primary/80"></div>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Enhanced Fullscreen Gallery Modal */}
      {images.length > 0 && (
        <ImageSwiperModal
          open={isFullscreen}
          onClose={() => setIsFullscreen(false)}
          images={images}
        />
      )}

      {/* ShareModal component with the correct props */}
      {!readOnly && (
        <ShareModal
          showModal={showModal}
          setShowModal={setShowModal}
          shareData={shareData}
          loadingShare={loadingShare}
        />
      )}
    </div>
  );
}
