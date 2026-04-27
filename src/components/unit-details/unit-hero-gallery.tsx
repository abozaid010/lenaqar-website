'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import type { UnitHeroGalleryProps } from '@/lib/units/unit-types';
import { useI18n } from '@/hooks/useI18n';

export default function UnitHeroGallery({ images, isPrimary }: UnitHeroGalleryProps) {
  const { t } = useI18n();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
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
        <Image
          src={currentImage.url}
          alt={currentImage.alt}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
        />

        {/* Navigation Controls */}
        {hasMultipleImages && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
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
              onClick={() => goToImage(index)}
              className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                index === currentImageIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image.url}
                alt={`${image.alt} - thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
