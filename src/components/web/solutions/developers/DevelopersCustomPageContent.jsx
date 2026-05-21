"use client";

import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import { getWhatsAppUrl } from "@/lib/solutions/links";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Globe,
  MessageCircle,
  Network,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import CalendarModal from "@/components/ui/calendar-modal";
import DevelopersLeadProfilePreview from "@/components/web/solutions/developers/DevelopersLeadProfilePreview";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lenaai.net";

function tk(path) {
  return `solutions.developers.customPage.${path}`;
}

function BulletList({ items, className = "" }) {
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {items.map((text) => (
        <li key={text} className="flex items-start gap-3 text-slate-700">
          <CheckCircle2
            className="h-5 w-5 text-primary shrink-0 mt-0.5"
            aria-hidden
          />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionHeading({ children, className = "" }) {
  return (
    <h2
      className={`text-2xl md:text-4xl font-bold text-primary leading-tight ${className}`}
    >
      {children}
    </h2>
  );
}

function OfferBlock({ icon: Icon, title, children, altBg = false }) {
  return (
    <section
      className={`py-16 md:py-20 ${altBg ? "bg-slate-50" : "bg-white"}`}
    >
      <div className="container max-w-4xl">
        <FadeIn>
          <div className="flex items-start gap-4 mb-6">
            <div className="rounded-xl bg-primary/10 p-3 shrink-0">
              <Icon className="h-7 w-7 text-primary" aria-hidden />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
              {title}
            </h3>
          </div>
          {children}
        </FadeIn>
      </div>
    </section>
  );
}

export default function DevelopersCustomPageContent() {
  const { translate } = useI18n();
  const partnerMsg = translate("solutions.developers.partnerMessage");

  const heroHelps = [
    translate(tk("hero.helps.item1")),
    translate(tk("hero.helps.item2")),
    translate(tk("hero.helps.item3")),
    translate(tk("hero.helps.item4")),
    translate(tk("hero.helps.item5")),
    translate(tk("hero.helps.item6")),
  ];

  const offer1Features = Array.from({ length: 8 }, (_, i) =>
    translate(tk(`offer1.features.item${i + 1}`))
  );
  const offer1Problems = Array.from({ length: 5 }, (_, i) =>
    translate(tk(`offer1.problems.item${i + 1}`))
  );
  const offer1Profile = Array.from({ length: 6 }, (_, i) =>
    translate(tk(`offer1.profile.item${i + 1}`))
  );

  const offer2Benefits = Array.from({ length: 5 }, (_, i) =>
    translate(tk(`offer2.benefits.item${i + 1}`))
  );

  const offer3Analytics = Array.from({ length: 6 }, (_, i) =>
    translate(tk(`offer3.analytics.item${i + 1}`))
  );
  const offer3Track = Array.from({ length: 5 }, (_, i) =>
    translate(tk(`offer3.track.item${i + 1}`))
  );

  const whyChooseKeys = [
    "reduceLoad",
    "improveLeads",
    "increaseExposure",
    "trackDemand",
    "fasterOps",
    "aiGrowth",
  ];

  const integrations = Array.from({ length: 6 }, (_, i) =>
    translate(tk(`egyptMarket.integrations.item${i + 1}`))
  );

  const futureTrends = Array.from({ length: 5 }, (_, i) =>
    translate(tk(`future.trends.item${i + 1}`))
  );

  const contactItems = Array.from({ length: 3 }, (_, i) =>
    translate(tk(`contact.items.item${i + 1}`))
  );

  const ctaClass =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-white text-primary font-semibold px-8 py-4 text-sm md:text-base shadow-xl hover:bg-slate-50 transition-colors";

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-primary text-white">
        <div className="container max-w-4xl">
          <FadeIn>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-200/90 mb-4">
              {translate("solutions.developers.hero.badge")}
            </p>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              {translate(tk("hero.title"))}
            </h1>
            <p className="mt-4 text-xl md:text-2xl font-semibold text-blue-100">
              {translate(tk("hero.subtitle"))}
            </p>
            <p className="mt-6 text-lg md:text-xl text-blue-100/90 leading-relaxed max-w-3xl">
              {translate(tk("hero.intro"))}
            </p>
            <p className="mt-10 text-base font-semibold text-blue-50">
              {translate(tk("hero.helpsTitle"))}
            </p>
            <ul className="mt-4 space-y-3">
              {heroHelps.map((item) => (
                <li key={item} className="flex items-start gap-3 text-blue-50">
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-[#21EAF4] mt-0.5"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a
              href={getWhatsAppUrl(partnerMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-10 ${ctaClass}`}
            >
              {translate(tk("hero.cta"))}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </a>
            <p className="mt-3 text-sm text-blue-200">
              {translate(tk("hero.ctaSub"))}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Offers intro */}
      <section className="py-16 md:py-20 bg-white border-b border-slate-100">
        <div className="container max-w-4xl">
          <FadeIn>
            <SectionHeading>{translate(tk("offers.sectionTitle"))}</SectionHeading>
          </FadeIn>
        </div>
      </section>

      {/* Offer 1 */}
      <OfferBlock icon={MessageCircle} title={translate(tk("offer1.title"))}>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
          {translate(tk("offer1.intro"))}
        </p>
        <h4 className="font-semibold text-slate-900 mb-4">
          {translate(tk("offer1.featuresTitle"))}
        </h4>
        <BulletList items={offer1Features} className="mb-10" />
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h4 className="font-bold text-lg text-primary mb-3">
            {translate(tk("offer1.whyTitle"))}
          </h4>
          <p className="text-slate-600 mb-4">{translate(tk("offer1.problemsIntro"))}</p>
          <ul className="space-y-2 mb-6">
            {offer1Problems.map((item) => (
              <li key={item} className="flex items-start gap-2 text-slate-700">
                <span className="text-red-500 font-bold mt-0.5" aria-hidden>
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-slate-800 font-medium mb-6">
            {translate(tk("offer1.solution"))}
          </p>
          <p className="font-semibold text-slate-900 mb-3">
            {translate(tk("offer1.profileTitle"))}
          </p>
          <BulletList items={offer1Profile} className="mb-6" />
          <p className="text-slate-700 leading-relaxed">
            {translate(tk("offer1.closing"))}
          </p>
        </div>
      </OfferBlock>

      <DevelopersLeadProfilePreview />

      {/* Offer 2 */}
      <OfferBlock
        icon={Network}
        title={translate(tk("offer2.title"))}
        altBg
      >
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
          {translate(tk("offer2.intro"))}
        </p>
        <h4 className="font-semibold text-slate-900 mb-4">
          {translate(tk("offer2.benefitsTitle"))}
        </h4>
        <BulletList items={offer2Benefits} className="mb-8" />
        <p className="text-slate-700 leading-relaxed rounded-xl bg-primary/5 border border-primary/10 p-6">
          {translate(tk("offer2.closing"))}
        </p>
      </OfferBlock>

      {/* Offer 3 */}
      <OfferBlock icon={BarChart3} title={translate(tk("offer3.title"))}>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
          {translate(tk("offer3.intro"))}
        </p>
        <h4 className="font-semibold text-slate-900 mb-4">
          {translate(tk("offer3.analyticsTitle"))}
        </h4>
        <BulletList items={offer3Analytics} className="mb-8" />
        <h4 className="font-semibold text-slate-900 mb-4">
          {translate(tk("offer3.trackTitle"))}
        </h4>
        <BulletList items={offer3Track} className="mb-8" />
        <p className="text-slate-700 leading-relaxed">
          {translate(tk("offer3.closing"))}
        </p>
      </OfferBlock>

      {/* Why choose */}
      <section className="py-16 md:py-24 bg-primary text-white">
        <div className="container max-w-4xl">
          <FadeIn>
            <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-12">
              {translate(tk("whyChoose.sectionTitle"))}
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {whyChooseKeys.map((key) => (
                <div
                  key={key}
                  className="rounded-2xl bg-white/10 border border-white/20 p-6"
                >
                  <Zap
                    className="h-6 w-6 text-[#21EAF4] mb-3"
                    aria-hidden
                  />
                  <h3 className="font-bold text-lg mb-2">
                    {translate(tk(`whyChoose.items.${key}.title`))}
                  </h3>
                  <p className="text-blue-100/90 text-sm leading-relaxed">
                    {translate(tk(`whyChoose.items.${key}.description`))}
                  </p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Egypt market */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container max-w-4xl">
          <FadeIn>
            <SectionHeading className="mb-6">
              {translate(tk("egyptMarket.sectionTitle"))}
            </SectionHeading>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              {translate(tk("egyptMarket.intro"))}
            </p>
            <p className="font-semibold text-slate-900 mb-4">
              {translate(tk("egyptMarket.integrationTitle"))}
            </p>
            <BulletList items={integrations} className="mb-6" />
            <p className="text-lg font-semibold text-primary">
              {translate(tk("egyptMarket.closing"))}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Future */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container max-w-4xl">
          <FadeIn>
            <div className="flex items-start gap-4 mb-6">
              <div className="rounded-xl bg-primary/10 p-3 shrink-0">
                <Sparkles className="h-7 w-7 text-primary" aria-hidden />
              </div>
              <SectionHeading>
                {translate(tk("future.sectionTitle"))}
              </SectionHeading>
            </div>
            <p className="text-lg text-slate-600 mb-6">
              {translate(tk("future.intro"))}
            </p>
            <ul className="space-y-3 mb-8">
              {futureTrends.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-slate-800 font-medium"
                >
                  <Target
                    className="h-5 w-5 text-primary shrink-0 mt-0.5"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-lg text-slate-700 leading-relaxed font-medium">
              {translate(tk("future.closing"))}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 md:py-24 bg-white border-t border-slate-100">
        <div className="container max-w-4xl">
          <FadeIn>
            <SectionHeading className="mb-8">
              {translate(tk("contact.sectionTitle"))}
            </SectionHeading>
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:underline mb-6"
            >
              <Globe className="h-5 w-5 shrink-0" aria-hidden />
              {translate(tk("contact.websiteLabel"))}
            </a>
            <p className="text-slate-600 mb-4">{translate(tk("contact.intro"))}</p>
            <ul className="space-y-2 mb-10">
              {contactItems.map((item) => (
                <li key={item} className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2
                    className="h-4 w-4 text-primary shrink-0"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              <a
                href={getWhatsAppUrl(partnerMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold px-8 py-4 text-sm md:text-base shadow-lg hover:opacity-95 transition-opacity"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                {translate(tk("contact.cta"))}
              </a>
              <CalendarModal
                buttonText={translate(tk("contact.ctaAlt"))}
                style="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary text-primary font-semibold px-8 py-4 text-sm md:text-base hover:bg-primary/5 transition-colors"
              />
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
