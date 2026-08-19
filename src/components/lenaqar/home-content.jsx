"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { sellerCtaHref } from "@/lib/lenaqar/whatsapp";
import { ANALYTICS } from "@/constants/analytics";
import WhatsAppCta from "./whatsapp-cta";
import ComparisonBlock from "./comparison-block";
import WhyUsBlock from "./why-us-block";
import CommissionBlock from "./commission-block";
import NetworkStrip from "./network-strip";
import OpportunityCard from "./opportunity-card";
import CoreActions from "./core-actions";
import OpportunitiesEmpty from "./opportunities-empty";

export default function HomeContent({ units = [] }) {
  const { translate } = useI18n();
  const preview = units.slice(0, 6);

  return (
    <>
      <div className="bg-primary/[0.04] border-b border-black/5">
        <section className="container pt-14 pb-8 sm:pt-20 sm:pb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary leading-[1.15] max-w-4xl">
            {translate("lenaqar.home.heroTitle")}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-black/75 max-w-3xl leading-relaxed">
            {translate("lenaqar.home.heroSub")}
          </p>
        </section>

        <section className="container pb-14 sm:pb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
            {translate("lenaqar.actions.title")}
          </h2>
          <p className="text-base sm:text-lg text-black/70 mb-5 max-w-2xl">
            {translate("lenaqar.actions.sub")}
          </p>
          <CoreActions anchor size="large" />
        </section>
      </div>

      <ComparisonBlock />

      <WhyUsBlock />

      <CommissionBlock />

      <section className="container py-10">
        <h2 className="text-xl font-bold text-primary mb-6">
          {translate("lenaqar.home.howTitle")}
        </h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((step) => (
            <li
              key={step}
              className="rounded-lg border border-black/10 p-5 bg-white"
            >
              <p className="text-xs text-black/50 mb-2 tabular-nums">{step}</p>
              <h3 className="font-semibold mb-2">
                {step === 4 ? (
                  <>
                    {translate("lenaqar.home.howStep4TitleBefore")}
                    <span className="font-extrabold text-red-600">
                      {translate("lenaqar.home.howStep4TitleHighlight")}
                    </span>
                  </>
                ) : (
                  translate(`lenaqar.home.howStep${step}Title`)
                )}
              </h3>
              <p className="text-sm text-black/70">
                {translate(`lenaqar.home.howStep${step}Body`)}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <Link
            href="/sell"
            className="text-sm text-primary font-medium underline-offset-2 hover:underline"
          >
            {translate("lenaqar.home.sellLearnMore")}
          </Link>
        </div>
      </section>

      <NetworkStrip />

      <section className="container py-10">
        <h2 className="text-xl font-bold text-primary">
          {translate("lenaqar.home.buyerTitle")}
        </h2>
        <p className="text-black/70 mt-2 mb-6">
          {translate("lenaqar.home.buyerSub")}
        </p>
        {preview.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {preview.map((unit) => (
                <OpportunityCard key={unit.code} unit={unit} />
              ))}
            </div>
            <div className="mt-6">
              <Link
                href="/opportunities"
                className="inline-flex items-center justify-center rounded-md bg-primary text-white font-medium px-4 py-3 text-sm min-h-11"
              >
                {translate("lenaqar.home.buyerCta")}
              </Link>
            </div>
          </>
        ) : (
          <OpportunitiesEmpty />
        )}
      </section>

      <section className="container py-10 pb-24 lg:pb-10">
        <h2 className="text-xl font-bold text-primary mb-3">
          {translate("lenaqar.home.lenaTitle")}
        </h2>
        <WhatsAppCta
          href={sellerCtaHref()}
          eventName={ANALYTICS.EVENTS.SELLER_WHATSAPP_CLICKED}
        >
          {translate("lenaqar.home.lenaCta")}
        </WhatsAppCta>
      </section>
    </>
  );
}
