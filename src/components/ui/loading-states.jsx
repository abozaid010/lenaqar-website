"use client";

import { Loader2 } from "lucide-react";

/**
 * Consistent loading spinner component
 */
export function LoadingSpinner({ 
  size = "default", 
  message = "Loading...", 
  containerClassName = "",
  showText = true 
}) {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-6 w-6",
    large: "h-8 w-8"
  };

  return (
    <div className={`flex items-center justify-center ${containerClassName}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
        {showText && (
          <span className="text-sm text-gray-600">{message}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Loading overlay for components
 */
export function LoadingOverlay({ 
  isVisible, 
  message = "Loading...", 
  spinnerSize = "default" 
}) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
      <LoadingSpinner size={spinnerSize} message={message} />
    </div>
  );
}

/**
 * Skeleton loader for contact list
 */
export function ContactListSkeleton({ count = 8 }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="p-4 border-b border-gray-100 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for chat messages
 */
export function ChatMessagesSkeleton({ count = 5 }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
          <div className="flex gap-3 max-w-[70%]">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
            <div className="flex flex-col gap-2">
              <div className={`h-20 bg-gray-200 rounded-2xl ${i % 2 === 0 ? "rounded-tl-sm" : "rounded-tr-sm"}`}></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Button loading state
 */
export function LoadingButton({ 
  isLoading, 
  children, 
  loadingText = "Loading...", 
  disabled = false,
  ...props 
}) {
  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={`${props.className || ""} ${(isLoading || disabled) ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
