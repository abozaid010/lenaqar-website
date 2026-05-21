"use client";

import CalendarModal from "@/components/ui/calendar-modal";
import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import SolutionsLeadProfilePreview from "@/components/web/solutions/ui/SolutionsLeadProfilePreview";
import { useI18n } from "@/hooks/useI18n";
import { getWhatsAppUrl } from "@/lib/solutions/links";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Globe,
  LayoutGrid,
  MessageCircle,
  Network,
  Target,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lenaai.net";
const LEAD_PREVIEW_ROOT = "solutions.brokers.customPage.leadPreview";

function tk(path) {
  return `solutions.brokers.customPage.${path}`;
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

const departmentIcons = {
  sales: MessageCircle,
  leads: Target,
  inventory: LayoutGrid,
  campaigns: Zap,
  team: Users,
  network: Network,
};

const departmentKeys = [
  "sales",
  "leads",
  "inventory",
  "campaigns",
  "team",
  "network",
];

const whyChooseKeys = [
  "automation",
  "qualifiedLeads",
  "smartCrm",
  "b2bNetwork",
];

export default function BrokersCustomPageContent() {
  const { translate } = useI18n();
  const partnerMsg = translate("solutions.brokers.partnerMessage");

  const heroHelps = Array.from({ length: 4 }, (_, i) =>
    translate(tk(`hero.helps.item${i + 1}`))
  );

  const offer1Features = Array.from({ length: 8 }, (_, i) =>
    translate(tk(`offer1.features.item${i + 1}`))
  );
  const offer2Features = Array.from({ length: 6 }, (_, i) =>
    translate(tk(`offer2.features.item${i + 1}`))
  );
  const offer3Features = Array.from({ length: 6 }, (_, i) =>
    translate(tk(`offer3.features.item${i + 1}`))
  );
  const offer4Features = Array.from({ length: 5 }, (_, i) =>
    translate(tk(`offer4.features.item${i + 1}`))
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
              {translate("solutions.brokers.hero.badge")}
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
            <Link href="/login" className={`mt-10 ${ctaClass}`}>
              {translate(tk("hero.cta"))}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <p className="mt-3 text-sm text-blue-200">
              {translate(tk("hero.ctaSub"))}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Manager vision */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-100">
        <div className="container max-w-4xl">
          <FadeIn>
            <div className="flex items-start gap-4 mb-6">
              <div className="rounded-xl bg-primary/10 p-3 shrink-0">
                <Bot className="h-7 w-7 text-primary" aria-hidden />
              </div>
              <div>
                <SectionHeading className="mb-4">
                  {translate(tk("manager.sectionTitle"))}
                </SectionHeading>
                <p className="text-lg text-slate-600 leading-relaxed">
                  {translate(tk("manager.subtitle"))}
                </p>
              </div>
            </div>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentKeys.map((key) => {
                const Icon = departmentIcons[key];
                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:border-primary/20 transition-colors"
                  >
                    <Icon
                      className="h-6 w-6 text-primary mb-3"
                      aria-hidden
                    />
                    <h3 className="font-bold text-slate-900 mb-2">
                      {translate(tk(`manager.departments.${key}.title`))}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {translate(tk(`manager.departments.${key}.description`))}
                    </p>
                  </div>
                );
              })}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Offers intro */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container max-w-4xl">
          <FadeIn>
            <SectionHeading>{translate(tk("offers.sectionTitle"))}</SectionHeading>
          </FadeIn>
        </div>
      </section>

      {/* Offer 1 — Automation */}
      <OfferBlock icon={Zap} title={translate(tk("offer1.title"))}>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
          {translate(tk("offer1.intro"))}
        </p>
        <h4 className="font-semibold text-slate-900 mb-4">
          {translate(tk("offer1.featuresTitle"))}
        </h4>
        <BulletList items={offer1Features} className="mb-8" />
        <p className="text-slate-700 leading-relaxed rounded-xl bg-primary/5 border border-primary/10 p-6">
          {translate(tk("offer1.closing"))}
        </p>
      </OfferBlock>

      {/* Offer 2 — Lead filtering */}
      <OfferBlock icon={Target} title={translate(tk("offer2.title"))} altBg>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
          {translate(tk("offer2.intro"))}
        </p>
        <h4 className="font-semibold text-slate-900 mb-4">
          {translate(tk("offer2.featuresTitle"))}
        </h4>
        <BulletList items={offer2Features} className="mb-8" />
        <p className="text-slate-700 leading-relaxed font-medium">
          {translate(tk("offer2.closing"))}
        </p>
      </OfferBlock>

      <SolutionsLeadProfilePreview translationRoot={LEAD_PREVIEW_ROOT} />

      {/* Offer 3 — CRM */}
      <OfferBlock icon={Building2} title={translate(tk("offer3.title"))}>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
          {translate(tk("offer3.intro"))}
        </p>
        <h4 className="font-semibold text-slate-900 mb-4">
          {translate(tk("offer3.featuresTitle"))}
        </h4>
        <BulletList items={offer3Features} className="mb-8" />
        <p className="text-slate-700 leading-relaxed rounded-xl bg-slate-50 border border-slate-200 p-6">
          {translate(tk("offer3.closing"))}
        </p>
      </OfferBlock>

      {/* Offer 4 — B2B network */}
      <OfferBlock icon={Network} title={translate(tk("offer4.title"))} altBg>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
          {translate(tk("offer4.intro"))}
        </p>
        <h4 className="font-semibold text-slate-900 mb-4">
          {translate(tk("offer4.featuresTitle"))}
        </h4>
        <BulletList items={offer4Features} className="mb-8" />
        <p className="text-slate-700 leading-relaxed rounded-xl bg-primary text-white p-6">
          {translate(tk("offer4.closing"))}
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

      {/* OS closing */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container max-w-4xl text-center">
          <FadeIn>
            <SectionHeading className="mb-6">
              {translate(tk("osClosing.sectionTitle"))}
            </SectionHeading>
            <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto mb-6">
              {translate(tk("osClosing.intro"))}
            </p>
            <p className="text-xl font-bold text-primary">
              {translate(tk("osClosing.closing"))}
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
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold px-8 py-4 text-sm md:text-base shadow-lg hover:opacity-95 transition-opacity"
              >
                {translate(tk("contact.cta"))}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <CalendarModal
                buttonText={translate(tk("contact.ctaAlt"))}
                style="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary text-primary font-semibold px-8 py-4 text-sm md:text-base hover:bg-primary/5 transition-colors"
              />
              <a
                href={getWhatsAppUrl(partnerMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white font-semibold px-8 py-4 text-sm md:text-base shadow-lg hover:opacity-95 transition-opacity"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                {translate("solutions.shared.cta.whatsapp")}
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
