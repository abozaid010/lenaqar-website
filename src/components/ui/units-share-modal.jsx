"use client";

import { useState, useEffect } from "react";
import {
  X,
  Copy,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  Type,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { getDisplayImageUrl } from "@/utils/imageUtils";

export default function ShareModal({
  showModal,
  setShowModal,
  shareData,
  loadingShare,
}) {
  const [copied, setCopied] = useState({
    english: false,
    arabic: false,
    link: false,
  });
  const [activeTab, setActiveTab] = useState("post");
  const [images, setImages] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useI18n();
  useEffect(() => {
    // Extract images if available in shareData
    if (shareData && shareData.images) {
      setImages(Array.isArray(shareData.images) ? shareData.images : []);
    } else {
      // Reset images if no data
      setImages([]);
    }
  }, [shareData]);

  const copyWithLink = (text, type) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied((prev) => ({ ...prev, [type]: true }));
      setTimeout(() => setCopied((prev) => ({ ...prev, [type]: false })), 2000);
    }
  };

  const nextSlide = () => {
    if (images.length > 0) {
      setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevSlide = () => {
    if (images.length > 0) {
      setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            {t.shareUnitContent}
          </h2>
          <button
            onClick={() => setShowModal(false)}
            className="icon-btn h-8 w-8 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab("post")}
              className={`px-4 py-2 font-medium text-sm flex items-center gap-1 ${
                activeTab === "post"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Type className="w-4 h-4" />
              {t.postContent}
            </button>
            <button
              onClick={() => setActiveTab("images")}
              className={`px-4 py-2 font-medium text-sm flex items-center gap-1 ${
                activeTab === "images"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Globe className="w-4 h-4" />
              {t.images} ({images.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="py-2">
            {loadingShare ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">
                  {t.loadingShareData}
                </span>
              </div>
            ) : (
              <>
                {activeTab === "post" && (
                  <div className="space-y-6">
                    {shareData ? (
                      <>
                        {/* English Post Text */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-medium text-gray-700">
                              English
                            </h3>
                            <button
                              onClick={() =>
                                copyWithLink(
                                  shareData.english_post_text,
                                  "english"
                                )
                              }
                              className="px-3 py-1 bg-primary hover:opacity-90 text-white text-sm rounded-lg flex items-center gap-1 transition-colors"
                            >
                              {copied.english ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy with Link
                                </>
                              )}
                            </button>
                          </div>
                          <div className="p-4 max-h-48 overflow-y-auto bg-white">
                            <pre className="text-sm whitespace-pre-wrap font-sans">
                              {shareData.english_post_text ||
                                "No English text available."}
                            </pre>
                          </div>
                        </div>

                        {/* Arabic Post Text */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-medium text-gray-700">
                              Arabic
                            </h3>
                            <button
                              onClick={() =>
                                copyWithLink(
                                  shareData.arabic_post_text,
                                  "arabic"
                                )
                              }
                              className="px-3 py-1 bg-primary hover:opacity-90 text-white text-sm rounded-lg flex items-center gap-1 transition-colors"
                            >
                              {copied.arabic ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  تم النسخ
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  نسخ مع الرابط
                                </>
                              )}
                            </button>
                          </div>
                          <div
                            className="p-4 max-h-48 overflow-y-auto bg-white text-right"
                            dir="rtl"
                          >
                            <pre className="text-sm whitespace-pre-wrap font-sans">
                              {shareData.arabic_post_text ||
                                "لا يوجد نص عربي متاح."}
                            </pre>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                        No data available to share.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "images" && (
                  <div className="mb-6">
                    {images && images.length > 0 ? (
                      <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden">
                        {/* Custom Image Carousel */}
                        <div className="w-full h-full relative">
                          {images.map((imageUrl, index) => (
                            <div
                              key={index}
                              className={`absolute inset-0 transition-opacity duration-300 ${
                                index === currentSlide
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            >
                              <div className="w-full h-full flex items-center justify-center">
                                <img
                                  src={
                                    getDisplayImageUrl(
                                      typeof imageUrl === "string"
                                        ? imageUrl
                                        : imageUrl?.url
                                    ) || "/api/placeholder/600/400"
                                  }
                                  alt={`Image ${index + 1}`}
                                  className="object-contain w-full h-full"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Navigation Controls */}
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={prevSlide}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={nextSlide}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>

                            {/* Pagination Indicator */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                              <div className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                                {currentSlide + 1} / {images.length}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                        {t.noImagesAvailable}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
          <div className="text-sm text-gray-500 text-center">
            {activeTab === "post"
              ? t.clickCopy
              : activeTab === "images" && images.length > 0
                ? `${images.length} images available for this listing`
                : "Share this listing with others"}
          </div>
        </div>
      </div>
    </div>
  );
}
