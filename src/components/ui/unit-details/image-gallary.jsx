"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Share2 } from "lucide-react";
import ShareModal from "@/components/ui/units-share-modal";
import { getShareUnitData } from "@/components/services/serviceFetching";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import toast from "react-hot-toast";

export default function ImageGallary({ images, unitName, unitId }) {
  const [showModal, setShowModal] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [loadingShare, setLoadingShare] = useState(false);

  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fullscreenSwiperRef = useRef(null);

  const openFullscreenGallery = () => {
    setIsFullscreen(true);
    if (fullscreenSwiperRef.current && fullscreenSwiperRef.current.swiper) {
      setTimeout(() => {
        fullscreenSwiperRef.current.swiper.slideTo(mainImageIndex, 0);
      }, 100);
    }
  };

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

  const closeFullscreenGallery = () => {
    setIsFullscreen(false);
  };

  return (
    <div className="space-y-2 w-full md:w-1/2 xl:w-2/5">
      <div
        className="relative h-[600px] w-full rounded-md overflow-hidden cursor-pointer shadow-lg group"
        onClick={openFullscreenGallery}
      >
        <Image
          src={images[mainImageIndex].url || "/images/defaultImage.jpg"}
          onError={(e) => {
            e.currentTarget.src = "/images/defaultImage.jpg";
            e.currentTarget.onerror = null;
          }}
          priority={true}
          alt={`${unitName}`}
          loading="eager"
          fill
          objectFit="cover"
          className="rounded-md transition-transform duration-300 group-hover:scale-105"
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
        <button
          type="button"
          onClick={handleShareClick}
          className="absolute top-4 left-4 cursor-pointer p-2.5 bg-white/90 rounded-full shadow-lg border border-gray-200"
        >
          <Share2 className="w-4 h-4 text-primary hover:text" />
        </button>
      </div>

      {/* Thumbnail swiper */}
      <Swiper
        modules={[Navigation, Thumbs]}
        spaceBetween={10}
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
              <Image
                fill
                src={image.url || "/images/defaultImage.jpg"}
                onError={(e) => {
                  e.currentTarget.src = "/images/defaultImage.jpg";
                  e.currentTarget.onerror = null;
                }}
                alt={`Unit - ${index + 1}`}
                loading="lazy"
                objectFit="cover"
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
      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex justify-between items-center p-4">
            <div className="text-white text-lg font-medium">{unitName}</div>
            <button
              onClick={closeFullscreenGallery}
              className="text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Swiper
              ref={fullscreenSwiperRef}
              modules={[Navigation, Pagination]}
              spaceBetween={0}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              className="w-full h-full"
              initialSlide={mainImageIndex}
              onSlideChange={(swiper) => setMainImageIndex(swiper.activeIndex)}
            >
              {images.length > 0 ? (
                images.map((image, index) => (
                  <SwiperSlide
                    key={index}
                    className="flex items-center justify-center"
                  >
                    <div className="relative w-full h-full max-w-7xl max-h-screen mx-auto">
                      <Image
                        src={image.url || "/images/defaultImage.jpg"}
                        onError={(e) => {
                          e.currentTarget.src = "/images/defaultImage.jpg";
                          e.currentTarget.onerror = null;
                        }}
                        alt={`Unit - ${index + 1}`}
                        fill
                        priority={true}
                        objectFit="contain"
                        loading="eager"
                      />
                    </div>
                  </SwiperSlide>
                ))
              ) : (
                <SwiperSlide className="flex items-center justify-center">
                  <div className="text-white text-center">
                    <p className="text-xl">No images available</p>
                  </div>
                </SwiperSlide>
              )}
            </Swiper>
          </div>
          <div className="p-4 flex justify-between items-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="text-white">
              {images.length > 0
                ? `Image ${mainImageIndex + 1} of ${images.length}`
                : "No images"}
            </div>
            <div className="text-white text-sm">
              Use arrow keys or swipe to navigate
            </div>
          </div>
        </div>
      )}

      {/* ShareModal component with the correct props */}
      <ShareModal
        showModal={showModal}
        setShowModal={setShowModal}
        shareData={shareData}
        loadingShare={loadingShare}
      />
    </div>
  );
}
