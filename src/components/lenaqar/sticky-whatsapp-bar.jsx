"use client";

import { MessageCircle } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { sellerCtaHref } from "@/lib/lenaqar/whatsapp";
import { ANALYTICS } from "@/constants/analytics";
import WhatsAppCta from "./whatsapp-cta";

export default function StickyWhatsappBar() {
  const { translate } = useI18n();

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-black/10 bg-white px-4 py-3">
      <WhatsAppCta
        href={sellerCtaHref()}
        eventName={ANALYTICS.EVENTS.SELLER_WHATSAPP_CLICKED}
        className="w-full"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        {translate("lenaqar.sticky.whatsapp")}
      </WhatsAppCta>
    </div>
  );
}
