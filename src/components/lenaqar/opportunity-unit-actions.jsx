"use client";

import { useI18n } from "@/hooks/useI18n";
import { ANALYTICS } from "@/constants/analytics";
import { buyerCtaHref } from "@/lib/lenaqar/whatsapp";
import WhatsAppCta from "./whatsapp-cta";

export default function OpportunityUnitActions({ unit, className = "" }) {
  const { translate } = useI18n();

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <WhatsAppCta
        href={buyerCtaHref(unit)}
        eventName={ANALYTICS.EVENTS.BUYER_WHATSAPP_CLICKED}
        className="w-full"
      >
        {translate("lenaqar.unit.cta")}
      </WhatsAppCta>
    </div>
  );
}
