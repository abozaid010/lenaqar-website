"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { ANALYTICS } from "@/constants/analytics";
import { marketplaceAddUnitHref } from "@/lib/lenaqar/whatsapp";
import {
  MARKETPLACE_CITY_FILTERS,
  requirementMatchesCity,
} from "@/lib/lenaqar/marketplace-city-filters";
import { BUYER_LANDING_LINKS } from "@/lib/lenaqar/buyer-landings";
import { BUYER_GUIDE_LINKS } from "@/lib/lenaqar/buyer-guides";
import WhatsAppCta from "./whatsapp-cta";
import RequirementCard from "./requirement-card";
import MarketplaceHowItWorks from "./marketplace-how-it-works";
import BuyRequestCta from "./buy-request-cta";
import FaqSection from "./faq-section";
import { actionButtonClass } from "@/components/ui/action-button-class";
import ActionButtonArrow from "@/components/ui/action-button-arrow";

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
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_100%_-10%,rgba(3,2,80,0.16),transparent_55%),radial-gradient(900px_420px_at_0%_100%,rgba(37,211,102,0.08),transparent_50%),linear-gradient(180deg,#f7f6f2_0%,#ffffff_72%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:repeating-linear-gradient(-12deg,transparent_0_14px,rgba(3,2,80,0.035)_14px_15px)]"
        />

        <div className="container relative pt-14 pb-12 sm:pt-20 sm:pb-16">
          <p className="text-xs font-semibold tracking-wide text-primary sm:text-sm">
            {translate("lenaqar.marketplace.hero.eyebrow")}
          </p>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-black/65 sm:text-sm">
            {translate("lenaqar.marketplace.hero.eyebrowDetail")}
          </p>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-[1.2] text-primary sm:mt-5 sm:text-5xl lg:text-6xl">
            {translate("lenaqar.marketplace.hero.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-black/75 sm:text-xl">
            {translate("lenaqar.marketplace.hero.sub")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <BuyRequestCta
              variant="primary"
              label={translate("lenaqar.marketplace.hero.buyCta")}
              className="!px-6 !py-3.5 !text-base font-bold"
            />
            <a
              href="#requirements"
              className={actionButtonClass({ variant: "secondary" })}
            >
              {translate("lenaqar.marketplace.hero.secondaryCta")}
              <ActionButtonArrow />
            </a>
            <Link
              href="/how-it-works"
              className={actionButtonClass({ variant: "secondary" })}
            >
              {translate("lenaqar.marketplace.hero.howCta")}
              <ActionButtonArrow />
            </Link>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-black/60">
            {translate("lenaqar.marketplace.hero.privacyNote")}
          </p>
        </div>
      </section>

      <section className="container py-10 sm:py-14">
        <h2 className="text-2xl font-bold text-primary sm:text-3xl">
          {translate("lenaqar.marketplace.why.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-base text-black/70">
          {translate("lenaqar.marketplace.why.sub")}
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <article
              key={n}
              className="rounded-2xl border border-primary/10 bg-white p-5"
            >
              <h3 className="font-bold text-primary">
                {translate(`lenaqar.marketplace.why.point${n}Title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-black/70">
                {translate(`lenaqar.marketplace.why.point${n}Body`)}
              </p>
            </article>
          ))}
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
              <BuyRequestCta variant="primary" />
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
              <BuyRequestCta variant="primary" />
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

      <section className="container py-10 sm:py-14">
        <h2 className="text-2xl font-bold text-primary sm:text-3xl">
          {translate("lenaqar.marketplace.browse.areasTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-base text-black/70">
          {translate("lenaqar.marketplace.browse.areasSub")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {BUYER_LANDING_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="min-h-11 rounded-lg border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              {translate(link.labelKey)}
            </Link>
          ))}
        </div>

        <h2 className="mt-12 text-2xl font-bold text-primary sm:text-3xl">
          {translate("lenaqar.marketplace.browse.guidesTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-base text-black/70">
          {translate("lenaqar.marketplace.browse.guidesSub")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {BUYER_GUIDE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="min-h-11 rounded-lg border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              {translate(link.labelKey)}
            </Link>
          ))}
        </div>
      </section>

      <section className="container py-10 sm:py-14">
        <FaqSection />
      </section>

      <section className="container py-12 pb-24 sm:py-16 lg:pb-16">
        <div className="rounded-3xl bg-primary px-6 py-10 text-white sm:px-10">
          <h2 className="max-w-3xl text-2xl font-bold leading-snug sm:text-3xl">
            {translate("lenaqar.marketplace.closing.title")}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/85">
            {translate("lenaqar.marketplace.closing.sub")}
          </p>
          <div className="mt-6">
            <BuyRequestCta
              variant="primary"
              tone="onPrimary"
              label={translate("lenaqar.marketplace.closing.cta")}
              className="!bg-white !text-primary hover:!bg-white/90"
            />
          </div>

          <div className="mt-10 border-t border-white/20 pt-8">
            <h3 className="text-lg font-bold">
              {translate("lenaqar.marketplace.closing.sellerTitle")}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
              {translate("lenaqar.marketplace.closing.sellerSub")}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <WhatsAppCta
                href={marketplaceAddUnitHref()}
                eventName={ANALYTICS.EVENTS.MARKETPLACE_WHATSAPP_CLICKED}
                className="!bg-[#25D366] hover:!bg-[#20BA5A]"
              >
                {translate("lenaqar.marketplace.closing.sellerCta")}
              </WhatsAppCta>
              <Link
                href="/network"
                className={`${actionButtonClass({ variant: "secondary", tone: "onPrimary" })} border-white/40`}
              >
                {translate("lenaqar.marketplace.audience.brokersCta")}
                <ActionButtonArrow />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
