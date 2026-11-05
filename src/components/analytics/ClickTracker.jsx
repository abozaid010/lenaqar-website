"use client";

import { useEffect } from "react";
import { ANALYTICS } from "@/constants/analytics";
import {
  OWN_WHATSAPP,
  trackContactLink,
  trackGa,
  trackShare,
  trackWhatsAppClick,
} from "@/lib/analytics";
import { classifyWhatsAppHref } from "@/lib/analytics-utils";

/**
 * Data attributes read from the clicked element (all optional):
 *   data-cta-intent, data-cta-location, data-unit-code, data-lead-code,
 *   data-requirement-ref, data-share-method, data-share-item, data-track (generic cta_click id)
 */
export default function ClickTracker() {
  useEffect(() => {
    const onClick = (event) => {
      if (!(event.target instanceof Element)) return;
      const el = event.target.closest("a[href], [data-track]");
      if (!el) return;
      const d = el.dataset;
      const href = el.getAttribute("href") || "";

      if (href.startsWith("tel:")) return trackContactLink("phone");
      if (href.startsWith("mailto:")) return trackContactLink("email");
      if (d.shareMethod) return trackShare({ method: d.shareMethod, itemId: d.shareItem });

      const wa = classifyWhatsAppHref(href, OWN_WHATSAPP);
      if (wa?.kind === "contact" && wa.target !== "other") {
        return trackWhatsAppClick({
          intent: d.ctaIntent || (wa.target === "network" ? "network" : "general"),
          location: d.ctaLocation,
          unitCode: d.unitCode,
          leadCode: d.leadCode,
          requirementRef: d.requirementRef,
        });
      }

      if (d.track) {
        trackGa(ANALYTICS.EVENTS.CTA_CLICK, {
          cta_id: d.track,
          cta_location: d.ctaLocation,
          destination: href || undefined,
          unit_code: d.unitCode,
        });
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
