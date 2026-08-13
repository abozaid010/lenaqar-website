"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { sellerCtaHref } from "@/lib/lenaqar/whatsapp";
import { ANALYTICS } from "@/constants/analytics";
import WhatsAppCta from "./whatsapp-cta";
import ComparisonBlock from "./comparison-block";
import NetworkStrip from "./network-strip";
import OpportunityCard from "./opportunity-card";
import CoreActions from "./core-actions";

export default function HomeContent({ units = [] }) {
  const { translate } = useI18n();
  const preview = units.slice(0, 6);

  return (
    <>
      <section className="container py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary leading-snug">
          {translate("lenaqar.home.heroTitle")}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-black/70 max-w-2xl">
          {translate("lenaqar.home.heroSub")}
        </p>
        <CoreActions className="mt-6" anchor />
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link
            href="/calculator"
            className="text-primary font-medium underline-offset-2 hover:underline"
          >
            {translate("lenaqar.home.primaryCta")}
          </Link>
          <Link
            href="/opportunities"
            className="text-primary font-medium underline-offset-2 hover:underline"
          >
            {translate("lenaqar.home.buyerCta")}
          </Link>
        </p>
      </section>

      <ComparisonBlock />

      <section className="container py-10">
        <h2 className="text-xl font-bold text-primary mb-6">
          {translate("lenaqar.home.howTitle")}
        </h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((step) => (
            <li
              key={step}
              className="rounded-lg border border-black/10 p-5 bg-white"
            >
              <p className="text-xs text-black/50 mb-2 tabular-nums">{step}</p>
              <h3 className="font-semibold mb-2">
                {translate(`lenaqar.home.howStep${step}Title`)}
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
          <div className="rounded-lg border border-black/10 bg-white p-6">
            <p className="text-black/70">
              {translate("lenaqar.opportunities.empty")}
            </p>
          </div>
        )}
      </section>

      <section className="container py-10">
        <h2 className="text-xl font-bold text-primary mb-4">
          {translate("lenaqar.home.whyTitle")}
        </h2>
        <ul className="space-y-3 text-black/80">
          <li>{translate("lenaqar.home.why1")}</li>
          <li>{translate("lenaqar.home.why2")}</li>
          <li>{translate("lenaqar.home.why3")}</li>
        </ul>
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
