'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Image as ImageIcon, PlayCircle, Share2 } from 'lucide-react';
import ImageSwiperModal from '@/components/ui/images-swiper-modal';
import type { UnitHeroGalleryProps } from '@/lib/units/unit-types';
import { useI18n } from '@/hooks/useI18n';

export default function UnitHeroGallery({
  images,
  isPrimary,
  canShare = false,
  onShare,
}: UnitHeroGalleryProps) {
  const { t, translate } = useI18n();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shareLabel = translate('unitShare.title', 'Share Property');

  const galleryImages = useMemo(
    () => images.filter((image) => image.type !== 'video'),
    [images]
  );

  const shareButton =
    canShare && onShare ? (
      <button
        type="button"
        onClick={onShare}
        aria-label={shareLabel}
        className="absolute top-4 end-4 z-30 p-2.5 rounded-full bg-white/90 text-primary shadow-md hover:bg-white transition-colors"
      >
        <Share2 className="w-4 h-4" />
      </button>
    ) : null;

  if (images.length === 0) {
    return (
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        {shareButton}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <ImageIcon className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">{t?.unitLabels?.noImages || 'No images available'}</p>
          <p className="text-sm mt-2">{t?.unitLabels?.noImagesDescription || 'This property has no photos yet'}</p>
        </div>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];
  const hasMultipleImages = images.length > 1;
  const isCurrentVideo = currentImage?.type === 'video';

  const goToPrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const openFullscreen = () => {
    if (isCurrentVideo || galleryImages.length === 0) return;
    setIsFullscreen(true);
  };

  const fullscreenInitialSlide = Math.max(
    0,
    galleryImages.findIndex((image) => image.url === currentImage?.url)
  );

  return (
    <div className="space-y-4">
      {/* Primary Unit Badge */}
      {isPrimary && (
        <div className="flex justify-end">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {t?.unitLabels?.primaryUnit || 'Primary Unit'}
          </span>
        </div>
      )}

      {/* Main Image */}
      <div className="relative w-full h-96 lg:h-[500px] bg-gray-100 rounded-lg overflow-hidden group">
        {shareButton}
        {isCurrentVideo ? (
          currentImage.provider === 'file' ? (
            <video
              src={currentImage.url}
              className="w-full h-full object-cover"
              controls
              preload="metadata"
            />
          ) : (
            <iframe
              src={currentImage.url}
              className="w-full h-full"
              title={currentImage.alt}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )
        ) : (
          <button
            type="button"
            onClick={openFullscreen}
            className="absolute inset-0 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={translate('unitDetails.viewFullscreen', 'Click to view in fullscreen')}
          >
            <Image
              src={currentImage.url}
              alt={currentImage.alt}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pointer-events-none">
              <span className="mb-4 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm">
                {translate('unitDetails.viewFullscreen', 'Click to view in fullscreen')}
              </span>
            </div>
          </button>
        )}

        {/* Navigation Controls */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute start-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
              aria-label={translate('common.previous', 'Previous')}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute end-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
              aria-label={translate('common.next', 'Next')}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute top-4 start-4 z-20 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToImage(index)}
              className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                index === currentImageIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-label={translate('imageViewer.viewImageN', 'View image {n}').replace(
                '{n}',
                String(index + 1)
              )}
            >
              {image.type === 'video' ? (
                <div className="w-full h-full bg-gray-900 text-white flex items-center justify-center">
                  <PlayCircle className="w-8 h-8" />
                </div>
              ) : (
                <Image
                  src={image.url}
                  alt={`${image.alt} - thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {galleryImages.length > 0 && (
        <ImageSwiperModal
          open={isFullscreen}
          onClose={() => setIsFullscreen(false)}
          images={galleryImages.map((image) => ({ url: image.url, alt: image.alt }))}
          showMasterPlanLabel={false}
          initialSlide={fullscreenInitialSlide}
        />
      )}
    </div>
  );
}
