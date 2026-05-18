"use client";

import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import { getWhatsAppUrl } from "@/lib/solutions/links";
import { ArrowRight, XCircle } from "lucide-react";

const PAIN_KEYS = [
  "solutions.agencies.landing.hero.pains.noResponse",
  "solutions.agencies.landing.hero.pains.delayed",
  "solutions.agencies.landing.hero.pains.manual",
  "solutions.agencies.landing.hero.pains.overload",
  "solutions.agencies.landing.hero.pains.wasted",
];

export default function AgenciesHeroSection() {
  const { translate } = useI18n();
  const partnerMsg = translate("solutions.agencies.partnerMessage");

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-primary text-white">
      <div className="container max-w-4xl">
        <FadeIn>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
            {translate("solutions.agencies.landing.hero.title")}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-blue-100/90 leading-relaxed max-w-3xl">
            {translate("solutions.agencies.landing.hero.subtitle")}
          </p>
          <ul className="mt-10 space-y-3">
            {PAIN_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-3 text-blue-50">
                <XCircle className="h-5 w-5 shrink-0 text-red-300 mt-0.5" aria-hidden />
                <span>{translate(key)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 p-6 rounded-xl bg-white/10 border border-white/20 text-lg font-semibold text-blue-50 leading-relaxed">
            {translate("solutions.agencies.landing.hero.insight")}
          </p>
          <a
            href={getWhatsAppUrl(partnerMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-primary font-semibold px-8 py-4 text-sm md:text-base shadow-xl hover:bg-slate-50 transition-colors"
          >
            {translate("solutions.agencies.landing.hero.cta")}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </a>
          <p className="mt-3 text-sm text-blue-200">
            {translate("solutions.agencies.landing.hero.ctaSub")}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
