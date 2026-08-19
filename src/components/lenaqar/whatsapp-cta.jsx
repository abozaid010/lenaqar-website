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

  function handleClick(event) {
    if (eventName) trackEvent(eventName);
    trackMetaContact();
    if (!href || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const opened = window.open(href, "_blank", "noopener,noreferrer");
    if (opened) {
      event.preventDefault();
      opened.opener = null;
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`${variant === "primary" ? PRIMARY_CLASS : WHATSAPP_CLASS} ${className}`}
    >
      {children}
    </a>
  );
}
