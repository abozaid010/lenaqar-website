"use client";

import { guideLeadWhatsAppHref } from "@/lib/guides/whatsapp";

export default function GuideStickyWhatsApp({ leadCode }) {
  const href = guideLeadWhatsAppHref(leadCode);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 inset-inline-end-4 z-40 lg:hidden inline-flex items-center gap-2 rounded-full bg-primary text-white px-4 py-3 text-sm font-bold shadow-lg"
      data-analytics="click_whatsapp"
      data-lead-code={leadCode || ""}
      aria-label="تواصل واتساب"
    >
      واتساب
    </a>
  );
}
