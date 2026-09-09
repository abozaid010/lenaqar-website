"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { ANALYTICS } from "@/constants/analytics";
import { marketplaceAddUnitHref } from "@/lib/lenaqar/whatsapp";
import {
  MARKETPLACE_CITY_FILTERS,
  requirementMatchesCity,
} from "@/lib/lenaqar/marketplace-city-filters";
import WhatsAppCta from "./whatsapp-cta";
import RequirementCard from "./requirement-card";
import MarketplaceHowItWorks from "./marketplace-how-it-works";

export default function MarketplaceHomeContent({
  requirements = [],
  error = null,
}) {
  const { translate } = useI18n();
  const [cityFilter, setCityFilter] = useState("");

  const filtered = useMemo(
    () =>
      requirements.filter((row) => requirementMatchesCity(row, cityFilter)),
    [requirements, cityFilter],
  );

  return (
    <>
      <section className="relative overflow-hidden border-b border-primary/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_100%_-10%,rgba(3,2,80,0.16),transparent_55%),radial-gradient(900px_420px_at_0%_100%,rgba(37,211,102,0.12),transparent_50%),linear-gradient(180deg,#f7f6f2_0%,#ffffff_72%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:repeating-linear-gradient(-12deg,transparent_0_14px,rgba(3,2,80,0.035)_14px_15px)]"
        />

        <div className="container relative pt-14 pb-12 sm:pt-20 sm:pb-16">
          <div className="max-w-3xl space-y-1.5">
            <p className="text-xs font-semibold tracking-wide text-primary sm:text-sm">
              {translate("lenaqar.marketplace.hero.eyebrow")}
            </p>
            <p className="text-xs leading-relaxed text-black/65 sm:text-sm">
              {translate("lenaqar.marketplace.hero.eyebrowDetail")}
            </p>
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.15] text-primary sm:mt-5 sm:text-5xl lg:text-6xl">
            {translate("lenaqar.marketplace.hero.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-black/75 sm:text-xl">
            {translate("lenaqar.marketplace.hero.sub")}
          </p>

          <div className="mt-8">
            <WhatsAppCta
              href={marketplaceAddUnitHref()}
              eventName={ANALYTICS.EVENTS.MARKETPLACE_WHATSAPP_CLICKED}
              className="!px-6 !py-3.5 !text-base font-bold"
            >
              {translate("lenaqar.marketplace.hero.whatsappCta")}
            </WhatsAppCta>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-black/60">
            {translate("lenaqar.marketplace.hero.privacyNote")}
          </p>
        </div>
      </section>

      <section id="requirements" className="container scroll-mt-24 py-10 sm:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">
              {translate("lenaqar.marketplace.list.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-base text-black/70">
              {translate("lenaqar.marketplace.list.sub")}
            </p>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={translate("lenaqar.marketplace.filter.cityLabel")}
          >
            <button
              type="button"
              onClick={() => setCityFilter("")}
              className={`min-h-10 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                cityFilter === ""
                  ? "bg-primary text-white"
                  : "border border-primary/20 bg-white text-primary hover:bg-primary/5"
              }`}
            >
              {translate("lenaqar.marketplace.filter.all")}
            </button>
            {MARKETPLACE_CITY_FILTERS.map((city) => {
              const active = cityFilter === city.value;
              return (
                <button
                  key={city.value}
                  type="button"
                  onClick={() => setCityFilter(city.value)}
                  className={`min-h-10 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-primary text-white"
                      : "border border-primary/20 bg-white text-primary hover:bg-primary/5"
                  }`}
                >
                  {city.label}
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-semibold text-amber-950">
              {translate("lenaqar.marketplace.list.errorTitle")}
            </p>
            <p className="mt-1 text-sm text-amber-900/80">
              {translate("lenaqar.marketplace.list.error")}
            </p>
            <div className="mt-4">
              <WhatsAppCta
                href={marketplaceAddUnitHref()}
                eventName={ANALYTICS.EVENTS.MARKETPLACE_WHATSAPP_CLICKED}
              >
                {translate("lenaqar.marketplace.hero.whatsappCta")}
              </WhatsAppCta>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-primary/10 bg-primary/[0.03] p-6">
            <p className="font-semibold text-primary">
              {translate("lenaqar.marketplace.list.emptyTitle")}
            </p>
            <p className="mt-2 text-sm text-black/70">
              {translate("lenaqar.marketplace.list.empty")}
            </p>
            <div className="mt-4">
              <WhatsAppCta
                href={marketplaceAddUnitHref()}
                eventName={ANALYTICS.EVENTS.MARKETPLACE_WHATSAPP_CLICKED}
              >
                {translate("lenaqar.marketplace.hero.whatsappCta")}
              </WhatsAppCta>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-black/55">
              {translate("lenaqar.marketplace.list.count", "{count} طلب").replace(
                "{count}",
                String(filtered.length),
              )}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((requirement) => (
                <RequirementCard
                  key={requirement.id}
                  requirement={requirement}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <div className="border-y border-primary/10 bg-[#f7f6f2]">
        <MarketplaceHowItWorks />
      </div>

      <section className="container py-12 pb-24 sm:py-16 lg:pb-16">
        <div className="rounded-3xl bg-primary px-6 py-10 text-white sm:px-10">
          <h2 className="max-w-3xl text-2xl font-bold leading-snug sm:text-3xl">
            {translate("lenaqar.marketplace.closing.title")}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85">
            {translate("lenaqar.marketplace.closing.sub")}
          </p>
          <div className="mt-6">
            <WhatsAppCta
              href={marketplaceAddUnitHref()}
              eventName={ANALYTICS.EVENTS.MARKETPLACE_WHATSAPP_CLICKED}
              className="!bg-[#25D366] hover:!bg-[#20BA5A]"
            >
              {translate("lenaqar.marketplace.closing.cta")}
            </WhatsAppCta>
          </div>
        </div>
      </section>
    </>
  );
}
