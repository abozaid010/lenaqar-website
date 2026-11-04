"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom hook for gentle auto-scroll behavior.
 * Triggers after a delay, cancels immediately on user interaction.
 * Only triggers once per session.
 *
 * @param {Object} options - Configuration options
 * @param {number} options.delay - Delay before auto-scroll in ms (default: 5000)
 * @param {string} options.targetId - ID of element to scroll to (default: "")
 * @param {boolean} options.enabled - Whether auto-scroll is enabled (default: true)
 */
export function useAutoScroll(options = {}) {
  const { delay = 5000, targetId = "", enabled = true } = options;
  const hasScrolled = useRef(false);
  const [shouldScroll, setShouldScroll] = useState(false);
  const userInteracted = useRef(false);

  useEffect(() => {
    if (!enabled || hasScrolled.current || userInteracted.current) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    let timeoutId;

    const triggerScroll = () => {
      if (userInteracted.current) return;

      const targetElement = targetId
        ? document.getElementById(targetId)
        : null;

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        hasScrolled.current = true;
      }
    };

    timeoutId = setTimeout(triggerScroll, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [delay, targetId, enabled]);

  // Track user interaction to cancel auto-scroll
  useEffect(() => {
    const handleInteraction = () => {
      userInteracted.current = true;
    };

    const events = ["scroll", "touchstart", "touchmove", "keydown", "mousedown"];

    events.forEach((event) => {
      window.addEventListener(event, handleInteraction, { once: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  return {
    hasScrolled: hasScrolled.current,
    userInteracted: userInteracted.current,
  };
}
