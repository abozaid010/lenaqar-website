"use client";

import { useI18n } from "@/hooks/useI18n";
import { ANALYTICS } from "@/constants/analytics";
import { buyerCtaHref } from "@/lib/lenaqar/whatsapp";
import { opportunityToUnitFormPrefill } from "@/lib/lenaqar/opportunity-to-unit-form";
import AddUnitButton from "@/components/ui/unit-forms/add-unit-button";
import WhatsAppCta from "./whatsapp-cta";

export default function OpportunityUnitActions({ unit, className = "" }) {
  const { translate } = useI18n();
  const prefill = opportunityToUnitFormPrefill(unit);

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <AddUnitButton
        unitData={prefill}
        label={translate("lenaqar.unit.addDetails", "Add Unit Details")}
        className="w-full"
      />
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
