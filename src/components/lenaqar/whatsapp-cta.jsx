"use client";

import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { trackMetaContact } from "@/lib/meta-pixel";

const WHATSAPP_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium px-4 py-3 text-sm shadow-md transition-colors";

const PRIMARY_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-md bg-primary text-white font-medium px-4 py-3 text-sm shadow-md transition-colors";

export default function WhatsAppCta({
  href,
  eventName,
  children,
  variant = "whatsapp",
  className = "",
}) {
  const { trackEvent } = useGoogleAnalytics();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (eventName) trackEvent(eventName);
        trackMetaContact();
      }}
      className={`${variant === "primary" ? PRIMARY_CLASS : WHATSAPP_CLASS} ${className}`}
    >
      {children}
    </a>
  );
}
