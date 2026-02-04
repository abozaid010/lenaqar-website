"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Renders children only when the wrapper enters (or is near) the viewport.
 * Until then shows an optional placeholder. Used for progressive loading:
 * images and heavy content mount only when the user scrolls to them.
 *
 * @param {React.ReactNode} children - Content to render when visible
 * @param {React.ReactNode} [placeholder] - Optional placeholder (e.g. skeleton) when not visible
 * @param {string} [rootMargin] - IntersectionObserver rootMargin, e.g. "100px" to load slightly before visible
 * @param {number} [threshold] - IntersectionObserver threshold (0-1)
 * @param {string} [className] - Optional class for the wrapper div
 */
export default function LazyVisible({
  children,
  placeholder = null,
  rootMargin = "120px",
  threshold = 0,
  className = "",
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : placeholder}
    </div>
  );
}
