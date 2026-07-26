"use client";

import ImageWithLoader from "@/components/ui/image-with-loader";
import { useI18n } from "@/hooks/useI18n";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.5;
const DOUBLE_TAP_ZOOM = 2.5;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Touch/click zoomable image for lightbox viewers.
 * Supports pinch, wheel, double-tap, drag-to-pan, and button controls.
 */
export default function ZoomableImage({
  src,
  alt,
  className = "",
  sizes = "90vw",
  priority = false,
  onScaleChange,
  resetToken,
}) {
  const { translate } = useI18n();
  const containerRef = useRef(null);
  const [scale, setScale] = useState(MIN_SCALE);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

  const pointersRef = useRef(new Map());
  const pinchStartRef = useRef(null);
  const dragStartRef = useRef(null);
  const lastTapRef = useRef(0);
  const pointerOriginRef = useRef(null);
  const didPanRef = useRef(false);
  const scaleRef = useRef(scale);
  const positionRef = useRef(position);

  useEffect(() => {
    scaleRef.current = scale;
    onScaleChange?.(scale);
  }, [scale, onScaleChange]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const resetZoom = useCallback(() => {
    setScale(MIN_SCALE);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    setIsPinching(false);
    pointersRef.current.clear();
    pinchStartRef.current = null;
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    resetZoom();
  }, [resetToken, src, resetZoom]);

  const applyZoomAtPoint = useCallback((nextScale, clientX, clientY) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const offsetX = clientX - rect.left - rect.width / 2;
    const offsetY = clientY - rect.top - rect.height / 2;
    const prevScale = scaleRef.current;
    const clamped = clamp(nextScale, MIN_SCALE, MAX_SCALE);

    if (clamped === MIN_SCALE) {
      setScale(MIN_SCALE);
      setPosition({ x: 0, y: 0 });
      return;
    }

    const ratio = clamped / prevScale;
    setScale(clamped);
    setPosition({
      x: offsetX - (offsetX - positionRef.current.x) * ratio,
      y: offsetY - (offsetY - positionRef.current.y) * ratio,
    });
  }, []);

  const zoomBy = useCallback(
    (delta) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      applyZoomAtPoint(
        scaleRef.current + delta,
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
    },
    [applyZoomAtPoint]
  );

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP / 2 : ZOOM_STEP / 2;
      applyZoomAtPoint(scaleRef.current + delta, e.clientX, e.clientY);
    },
    [applyZoomAtPoint]
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const getPointerDistance = () => {
    const points = [...pointersRef.current.values()];
    if (points.length < 2) return 0;
    const [a, b] = points;
    return Math.hypot(b.x - a.x, b.y - a.y);
  };

  const getPointerCenter = () => {
    const points = [...pointersRef.current.values()];
    if (points.length === 0) return { x: 0, y: 0 };
    if (points.length === 1) return points[0];
    return {
      x: (points[0].x + points[1].x) / 2,
      y: (points[0].y + points[1].y) / 2,
    };
  };

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pointerOriginRef.current = { x: e.clientX, y: e.clientY };
    didPanRef.current = false;

    if (pointersRef.current.size === 2) {
      pinchStartRef.current = {
        distance: getPointerDistance(),
        scale: scaleRef.current,
      };
      dragStartRef.current = null;
      setIsDragging(false);
      setIsPinching(true);
      return;
    }

    if (scaleRef.current > MIN_SCALE) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - positionRef.current.x,
        y: e.clientY - positionRef.current.y,
      };
    }
  };

  const handlePointerMove = (e) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointerOriginRef.current) {
      const moved = Math.hypot(
        e.clientX - pointerOriginRef.current.x,
        e.clientY - pointerOriginRef.current.y
      );
      if (moved > 8) didPanRef.current = true;
    }

    if (pointersRef.current.size === 2 && pinchStartRef.current) {
      didPanRef.current = true;
      const distance = getPointerDistance();
      if (distance <= 0 || pinchStartRef.current.distance <= 0) return;
      const nextScale =
        pinchStartRef.current.scale *
        (distance / pinchStartRef.current.distance);
      const center = getPointerCenter();
      applyZoomAtPoint(nextScale, center.x, center.y);
      return;
    }

    if (isDragging && dragStartRef.current && scaleRef.current > MIN_SCALE) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handlePointerUp = (e) => {
    pointersRef.current.delete(e.pointerId);

    if (pointersRef.current.size < 2) {
      pinchStartRef.current = null;
      setIsPinching(false);
    }

    if (pointersRef.current.size === 1 && scaleRef.current > MIN_SCALE) {
      const remaining = [...pointersRef.current.values()][0];
      dragStartRef.current = {
        x: remaining.x - positionRef.current.x,
        y: remaining.y - positionRef.current.y,
      };
      setIsDragging(true);
    }

    if (pointersRef.current.size === 0) {
      const wasPan = didPanRef.current;
      setIsDragging(false);
      dragStartRef.current = null;
      pointerOriginRef.current = null;
      didPanRef.current = false;

      if (wasPan) {
        lastTapRef.current = 0;
        return;
      }

      // Double-tap / double-click zoom toggle
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        if (scaleRef.current > MIN_SCALE) {
          resetZoom();
        } else {
          applyZoomAtPoint(DOUBLE_TAP_ZOOM, e.clientX, e.clientY);
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    }
  };

  const isZoomed = scale > MIN_SCALE;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden touch-none select-none bg-stone-100 rounded-lg"
    >
      <div
        role="img"
        aria-label={alt}
        className={`w-full h-full will-change-transform ${
          isZoomed ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
        }`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
          transformOrigin: "center center",
          transition: isDragging || isPinching ? "none" : "transform 150ms ease-out",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <ImageWithLoader
          src={src}
          alt={alt}
          className={`w-full h-full object-contain pointer-events-none ${className}`}
          priority={priority}
          loadingVariant="default"
          sizes={sizes}
        />
      </div>

      <div className="absolute bottom-3 end-3 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            zoomBy(-ZOOM_STEP);
          }}
          disabled={scale <= MIN_SCALE}
          aria-label={translate("imageViewer.zoomOut", "Zoom out")}
          className="p-2 rounded-full bg-black/70 text-white hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            zoomBy(ZOOM_STEP);
          }}
          disabled={scale >= MAX_SCALE}
          aria-label={translate("imageViewer.zoomIn", "Zoom in")}
          className="p-2 rounded-full bg-black/70 text-white hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        {isZoomed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
            }}
            aria-label={translate("imageViewer.resetZoom", "Reset zoom")}
            className="p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
