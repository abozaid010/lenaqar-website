"use client";

import Image from "next/image";
import React, { useState } from "react";
import { markImageAsBroken, incrementRetryAttempts, shouldRetryImage, isConfiguredHostname } from "@/utils/imageUtils";

class ImageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Image rendering failed:", error?.message ?? error);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

/**
 * Professional Image Loading Component with advanced loading states
 * Features:
 * - Shimmer loading effect
 * - Smooth fade-in transitions
 * - Enhanced error handling
 * - Responsive loading indicators
 * - Professional animations
 */
export default function ImageWithLoader({
  src,
  alt,
  className = "",
  onError,
  onLoadComplete,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw",
  showLoadingText = false,
  loadingVariant = "default", // "default", "minimal", "skeleton"
  forceLoading = false, // Force loading state externally
}) {
  const isConfigured = isConfiguredHostname(src);
  const [isLoading, setIsLoading] = useState(isConfigured);
  const [hasError, setHasError] = useState(!isConfigured);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoadComplete) onLoadComplete();
  };

  const handleError = (e) => {
    // Ensure we have a valid event object
    if (!e || !e.currentTarget) {
      console.warn('Invalid error event received in ImageWithLoader');
      setIsLoading(false);
      setHasError(true);
      return;
    }
    
    const retryCount = incrementRetryAttempts(src);
    
    if (shouldRetryImage(src)) {
      // Retry the image after a short delay
      setTimeout(() => {
        // Check if the element still exists before trying to modify it
        if (e.currentTarget && e.currentTarget.src) {
          setIsLoading(true);
          setHasError(false);
          // Force re-render by updating the src
          e.currentTarget.src = src + '?retry=' + retryCount;
        } else {
          console.warn('Image element no longer available for retry');
          setIsLoading(false);
          setHasError(true);
        }
      }, 1000);
    } else {
      // After max retries, mark as broken and show error
      setIsLoading(false);
      setHasError(true);
      markImageAsBroken(src);
    }
    
    if (onError) onError(e);
  };

  const renderLoadingState = () => {
    switch (loadingVariant) {
      case "minimal":
        return (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        );

      case "skeleton":
        return (
          <div className="absolute inset-0 bg-gray-200 animate-pulse pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer transform -skew-x-12"></div>
          </div>
        );

      default:
        return (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse-soft pointer-events-none">
            {/* Shimmer overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer transform -skew-x-12"></div>

            {/* Loading content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-3">
                {/* Camera icon with pulse */}
                <div className="relative">
                  <svg
                    className="w-8 h-8 text-gray-400 animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div className="absolute inset-0 bg-gray-300 rounded-full animate-ping opacity-20"></div>
                </div>

                {/* Loading dots */}
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>

                {/* Loading text */}
                {showLoadingText && (
                  <span className="text-xs text-gray-400 font-medium">
                    Loading...
                  </span>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  const errorState = (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center pointer-events-none">
      <div className="text-center text-gray-400">
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <span className="text-xs font-medium">Image unavailable</span>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Loading State */}
      {(isLoading || forceLoading) && renderLoadingState()}

      {/* Error State */}
      {hasError && !isLoading && errorState}

      {/* Actual Image with smooth transition */}
      {isConfigured && !hasError && (
        <ImageErrorBoundary 
          fallback={errorState} 
          onError={(e) => {
            // Ensure we update state to show error and stop loading
            setHasError(true);
            setIsLoading(false);
            if (onError) onError(e);
          }}
        >
          <Image
            fill
            src={src}
            alt={alt}
            className={`${className} transition-all duration-500 ease-out transform ${
              isLoading || forceLoading
                ? "opacity-0 scale-105"
                : "opacity-100 scale-100 animate-fade-in"
            }`}
            onLoad={handleLoad}
            onError={handleError}
            priority={priority}
            sizes={sizes}
          />
        </ImageErrorBoundary>
      )}
    </div>
  );
}
