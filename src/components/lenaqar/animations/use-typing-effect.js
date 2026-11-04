"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * Custom hook for progressive text reveal using typing effect.
 * Respects prefers-reduced-motion and supports RTL (Arabic).
 *
 * @param {string} text - The text to type out
 * @param {Object} options - Configuration options
 * @param {number} options.speed - Typing speed in ms per character (default: 50)
 * @param {boolean} options.delay - Initial delay before typing starts (default: 0)
 * @returns {string} - The currently displayed text
 */
export function useTypingEffect(text, options = {}) {
  const { speed = 50, delay = 0 } = options;
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    let timeoutId;
    let currentIndex = 0;

    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
        timeoutId = setTimeout(typeNextChar, speed);
      } else {
        setIsComplete(true);
      }
    };

    // Start typing after initial delay
    timeoutId = setTimeout(typeNextChar, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [text, speed, delay]);

  return displayedText;
}

/**
 * Motion component wrapper for typing animation.
 * Use this for consistent typing animation across components.
 */
export function TypingText({ text, className = "", speed = 50, delay = 0 }) {
  const displayedText = useTypingEffect(text, { speed, delay });

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayedText}
      <motion.span
        className="inline-block w-0.5 h-5 bg-primary ml-1"
        animate={{ opacity: [1, 0] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatDelay: 0.5,
        }}
      />
    </motion.span>
  );
}
