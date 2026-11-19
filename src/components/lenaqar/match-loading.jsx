"use client";

import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/hooks/useI18n";

/** One opacity cycle of the doorway, in ms (the same value as the CSS animation). */
const CYCLE_MS = 3000;

/**
 * Full-screen "we are matching your request" screen.
 *
 * Two uses, identical on screen so the buyer sees one continuous state:
 * - `modal`: the overlay `BuyRequestCta` shows while the request is saved and the match
 *   page opens. It takes focus and makes the rest of the page inert.
 * - default: the route's `loading.jsx` for `/requests/match/[ref]`.
 *
 * The doorway's phase comes from the clock, so a second instance (the route fallback
 * taking over from the overlay) continues the cycle instead of restarting it. Nothing
 * here keeps timers or counts: how long it stays is decided by the work behind it.
 */
export default function MatchLoading({ modal = false }) {
  const { translate } = useI18n();
  const titleId = useId();
  const rootRef = useRef(null);
  const doorRef = useRef(null);

  useLayoutEffect(() => {
    if (doorRef.current) {
      doorRef.current.style.animationDelay = `-${Date.now() % CYCLE_MS}ms`;
    }
  }, []);

  useEffect(() => {
    if (!modal) return undefined;
    const root = rootRef.current;
    const previous = document.activeElement;
    const inerted = [];
    for (const child of Array.from(document.body.children)) {
      if (child === root || child.hasAttribute("inert")) continue;
      child.setAttribute("inert", "");
      inerted.push(child);
    }
    root?.focus({ preventScroll: true });
    return () => {
      for (const child of inerted) child.removeAttribute("inert");
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [modal]);

  const screen = (
    <div
      ref={rootRef}
      {...(modal
        ? { role: "dialog", "aria-modal": "true", "aria-labelledby": titleId, tabIndex: -1 }
        : {})}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-white px-6 outline-none"
    >
      <div role="status" className="flex max-w-sm flex-col items-center text-center">
        <svg
          ref={doorRef}
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 64 88"
          className="lq-door h-20 w-auto text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 84V30a22 22 0 0 1 44 0v54" />
          <path d="M20 84V32a12 12 0 0 1 24 0v52" />
          <path d="M4 84h56" />
          <circle cx="38" cy="58" r="1.6" fill="currentColor" stroke="none" />
        </svg>
        <h1 id={titleId} className="lq-display mt-6 text-xl font-bold text-primary sm:text-2xl">
          {translate("lenaqar.matchPage.loadingTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          {translate("lenaqar.matchPage.loadingBody")}
        </p>
      </div>
    </div>
  );

  return modal ? createPortal(screen, document.body) : screen;
}
