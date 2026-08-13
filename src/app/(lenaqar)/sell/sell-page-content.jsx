"use client";

import { useI18n } from "@/hooks/useI18n";
import { sellerCtaHref } from "@/lib/lenaqar/whatsapp";
import { ANALYTICS } from "@/constants/analytics";
import ComparisonBlock from "@/components/lenaqar/comparison-block";
import NetworkStrip from "@/components/lenaqar/network-strip";
import WhatsAppCta from "@/components/lenaqar/whatsapp-cta";
import AddUnitButton from "@/components/ui/unit-forms/add-unit-button";

export default function SellPageContent() {
  const { translate } = useI18n();

  return (
    <>
      <section className="container py-12">
        <h1 className="text-3xl font-bold text-primary leading-snug">
          {translate("lenaqar.sell.title")}
        </h1>
        <p className="mt-4 text-black/70 max-w-2xl">
          {translate("lenaqar.sell.sub")}
        </p>
      </section>

      <section className="container pb-8">
        <h2 className="text-xl font-bold text-primary mb-3">
          {translate("lenaqar.sell.offerTitle")}
        </h2>
        <p className="text-black/80 max-w-2xl">
          {translate("lenaqar.sell.offerBody")}
        </p>
      </section>

      <ComparisonBlock />

      <section className="container py-8">
        <h2 className="text-xl font-bold text-primary mb-4">
          {translate("lenaqar.sell.criteriaTitle")}
        </h2>
        <ul className="space-y-2 text-black/80">
          <li>{translate("lenaqar.sell.criteria1")}</li>
          <li>{translate("lenaqar.sell.criteria2")}</li>
          <li>{translate("lenaqar.sell.criteria3")}</li>
          <li>{translate("lenaqar.sell.criteria4")}</li>
          <li>{translate("lenaqar.sell.criteria5")}</li>
        </ul>
      </section>

      <section className="container py-8">
        <h2 className="text-xl font-bold text-primary mb-3">
          {translate("lenaqar.sell.trustTitle")}
        </h2>
        <p className="text-black/80 max-w-2xl">
          {translate("lenaqar.sell.trustBody")}
        </p>
      </section>

      <NetworkStrip />

      <section className="container py-10 pb-24 lg:pb-10">
        <div className="flex flex-col gap-2 max-w-md">
          <AddUnitButton
            label={translate("lenaqar.actions.sellUnit", "Sell Unit")}
            showIcon={false}
            unitData={{ purpose: "sell" }}
            className="w-full"
          />
          <WhatsAppCta
            href={sellerCtaHref()}
            eventName={ANALYTICS.EVENTS.SELLER_WHATSAPP_CLICKED}
            className="w-full"
          >
            {translate("lenaqar.sell.cta")}
          </WhatsAppCta>
        </div>
      </section>
    </>
  );
}
