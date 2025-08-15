"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Robust Image Component with comprehensive error handling
 * Features:
 * - Fallback to default image on any error
 * - Handles API errors, network issues, and invalid URLs
 * - Multiple fallback strategies
 * - Loading states and error states
 * - Automatic retry with different image sources
 */
export default function RobustImage({
  src,
  alt,
  fallbackSrc = "/images/defaultImage.jpg",
  fallbackSrcs = [
    "/images/defaultImage.jpg",
    "/images/property_placeholder.jpg",
    "/images/logo.png"
  ],
  className = "",
  onError,
  onLoadComplete,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw",
  fill = false,
  width,
  height,
  ...props
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [currentFallbackIndex, setCurrentFallbackIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (onLoadComplete) onLoadComplete();
  };

  const handleError = (e) => {
    console.warn(`Image failed to load: ${currentSrc}`);
    
    // Try next fallback image
    if (currentFallbackIndex < fallbackSrcs.length - 1) {
      const nextIndex = currentFallbackIndex + 1;
      setCurrentFallbackIndex(nextIndex);
      setCurrentSrc(fallbackSrcs[nextIndex]);
      setHasError(false);
      setIsLoading(true);
      return;
    }
    
    // If all fallbacks failed, use the primary fallback
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
      return;
    }
    
    // Final fallback - show error state
    setIsLoading(false);
    setHasError(true);
    if (onError) onError(e);
  };

  // If the original src is invalid, start with fallback
  if (!src || src === 'undefined' || src === 'null' || src === '') {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  }

  // Error state UI
  if (hasError && !isLoading) {
    return (
      <div className={`${className} bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded-md`}>
        <div className="text-center text-gray-400 p-4">
          <div className="relative mb-3">
            <svg
              className="w-10 h-10 mx-auto text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
              />
            </svg>
          </div>
          <span className="text-xs font-medium">Image unavailable</span>
        </div>
      </div>
    );
  }

  // Loading state UI
  if (isLoading) {
    return (
      <div className={`${className} bg-gray-100 animate-pulse rounded-md flex items-center justify-center`}>
        <div className="text-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-2"></div>
          <span className="text-xs">Loading...</span>
        </div>
      </div>
    );
  }

  // Render the image
  if (fill) {
    return (
      <Image
        fill
        src={currentSrc}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        sizes={sizes}
        {...props}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      priority={priority}
      sizes={sizes}
      {...props}
    />
  );
}
