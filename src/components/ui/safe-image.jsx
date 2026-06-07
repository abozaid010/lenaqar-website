"use client";

import Image from "next/image";
import React from "react";
import { isConfiguredHostname } from "@/utils/imageUtils";

class ImageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("SafeImage: next/image failed, using native img:", error?.message);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function NativeImage({ src, alt, fill, width, height, className, style, onClick, title }) {
  if (fill) {
    return (
      <img
        src={src}
        alt={alt || ""}
        className={className}
        style={{ ...style, objectFit: "cover", width: "100%", height: "100%" }}
        onClick={onClick}
        title={title}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      width={width}
      height={height}
      className={className}
      style={style}
      onClick={onClick}
      title={title}
    />
  );
}

/**
 * A wrapper around next/image that safely handles unconfigured hostnames.
 * Falls back to a native img when the hostname is not in next.config or next/image throws.
 */
export default function SafeImage({ src, alt, ...props }) {
  if (!src) return null;

  const isConfigured = isConfiguredHostname(src);
  const nativeFallback = <NativeImage src={src} alt={alt} {...props} />;

  if (!isConfigured) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`SafeImage: Using native img for unconfigured hostname: ${src}`);
    }
    return nativeFallback;
  }

  return (
    <ImageErrorBoundary fallback={nativeFallback}>
      <Image src={src} alt={alt || ""} {...props} />
    </ImageErrorBoundary>
  );
}
