"use client";

import { useSyncExternalStore } from "react";

const LG_MEDIA_QUERY = "(min-width: 1024px)";

function subscribe(onStoreChange) {
  const mediaQuery = window.matchMedia(LG_MEDIA_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(LG_MEDIA_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/** True at Tailwind `lg` breakpoint (1024px) and above. */
export function useLgViewport() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
