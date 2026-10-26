"use client";

import { GUIDE_CTA_LINE, guideLeadWhatsAppHref } from "@/lib/guides/whatsapp";
import { actionButtonClass } from "@/components/ui/action-button-class";
import { ANALYTICS } from "@/constants/analytics";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

export default function GuideWhatsAppCta({ leadCode, compact = false }) {
  const href = guideLeadWhatsAppHref(leadCode);
  const { trackEvent } = useGoogleAnalytics();

  const onClick = () => {
    trackEvent(ANALYTICS.EVENTS.CLICK_WHATSAPP, {
      lead_code: leadCode || "",
      location: compact ? "guide_inline" : "guide_box",
    });
  };

  return (
    <div
      className={
        compact
          ? "my-6"
          : "my-8 rounded-2xl border border-primary/15 bg-primary/[0.03] p-5 space-y-3"
      }
    >
      {!compact ? (
        <p className="text-base text-black/80 leading-relaxed">{GUIDE_CTA_LINE}</p>
      ) : null}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={actionButtonClass({ variant: "primary" })}
        data-analytics="click_whatsapp"
        data-lead-code={leadCode || ""}
        onClick={onClick}
      >
        واتساب لينا عقار
      </a>
    </div>
  );
}
