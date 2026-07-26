'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import ImageSwiperModal from '@/components/ui/images-swiper-modal';
import type { ProjectHeroGalleryProps } from '@/lib/projects/project-types';
import { useI18n } from '@/hooks/useI18n';

export default function ProjectHeroGallery({ images, isPrimary }: ProjectHeroGalleryProps) {
  const { translate } = useI18n();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <ImageIcon className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">
            {translate('unitDetails.noImages', 'No images available')}
          </p>
          <p className="text-sm mt-2">
            {translate('projectDetails.noImagesDescription', 'This project has no photos yet')}
          </p>
        </div>
      </div>
    );
  }

  const currentImage = images[currentImageIndex];
  const hasMultipleImages = images.length > 1;

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

  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden group">
      <button
        type="button"
        onClick={() => setIsFullscreen(true)}
        className="absolute inset-0 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={translate('unitDetails.viewFullscreen', 'Click to view in fullscreen')}
      >
        <Image
          src={currentImage.url}
          alt={currentImage.alt}
          fill
          className="object-cover"
          priority={currentImageIndex === 0}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </button>

      {hasMultipleImages && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute start-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
            className="absolute end-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label={translate('common.next', 'Next')}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {hasMultipleImages && (
        <div className="absolute top-4 end-4 z-20 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
          {currentImageIndex + 1} / {images.length}
        </div>
      )}

      {isPrimary && (
        <div className="absolute top-4 start-4 z-20 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          {translate('projectDetails.featuredProject', 'Featured Project')}
        </div>
      )}

      {hasMultipleImages && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 p-2 rounded-lg z-20">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(index);
              }}
              className={`relative w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                index === currentImageIndex
                  ? 'border-white scale-110'
                  : 'border-transparent hover:border-white/60'
              }`}
              aria-label={translate('imageViewer.viewImageN', 'View image {n}').replace(
                '{n}',
                String(index + 1)
              )}
            >
              <Image
                src={image.url}
                alt={`${image.alt} thumbnail`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <ImageSwiperModal
        open={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        images={images.map((image) => ({ url: image.url, alt: image.alt }))}
        showMasterPlanLabel={false}
        initialSlide={currentImageIndex}
      />
    </div>
  );
}
