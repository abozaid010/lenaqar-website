"use client";

import CalendarModal from "@/components/ui/calendar-modal";
import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import { getWhatsAppUrl } from "@/lib/solutions/links";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export default function SolutionHero({ config }) {
  const { translate } = useI18n();
  const { hero, audience } = config;

  const headline = translate(hero.headlineKey);
  const subheadline = translate(hero.subheadlineKey);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const partnerMessage =
    audience === "agencies"
      ? translate("solutions.agencies.partnerMessage")
      : undefined;

  const renderPrimary = () => {
    if (hero.primaryCta === "demo") {
      return (
        <CalendarModal
          buttonText={translate(hero.primaryCtaKey)}
          style="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-primary font-semibold px-6 py-3.5 text-sm shadow-xl hover:bg-slate-50 transition-all"
        />
      );
    }
    if (hero.primaryCta === "login") {
      return (
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-primary font-semibold px-6 py-3.5 text-sm shadow-xl hover:bg-slate-50 transition-all"
        >
          {translate(hero.primaryCtaKey)}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      );
    }
    if (hero.primaryCta === "partner") {
      return (
        <a
          href={getWhatsAppUrl(partnerMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-primary font-semibold px-6 py-3.5 text-sm shadow-xl hover:bg-slate-50 transition-all"
        >
          {translate(hero.primaryCtaKey)}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      );
    }
    return null;
  };

  const renderSecondary = () => {
    if (hero.secondaryCta === "demo") {
      return (
        <CalendarModal
          buttonText={translate(hero.secondaryCtaKey)}
          style="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 text-white font-semibold px-6 py-3.5 text-sm hover:bg-white/10 transition-all"
        />
      );
    }
    if (hero.secondaryCta === "login") {
      return (
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 text-white font-semibold px-6 py-3.5 text-sm hover:bg-white/10 transition-all"
        >
          {translate(hero.secondaryCtaKey)}
        </Link>
      );
    }
    if (hero.secondaryCta === "scroll" && hero.scrollTargetId) {
      return (
        <button
          type="button"
          onClick={() => scrollTo(hero.scrollTargetId)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 text-white font-semibold px-6 py-3.5 text-sm hover:bg-white/10 transition-all"
        >
          <Play className="h-4 w-4" aria-hidden />
          {translate(hero.secondaryCtaKey)}
        </button>
      );
    }
    return null;
  };

  return (
    <section className="relative overflow-hidden bg-primary pt-28 pb-20 md:pt-36 md:pb-28">
      <div
        className="absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(33,234,244,0.25), transparent), radial-gradient(ellipse 60% 50% at 100% 50%, rgba(57,38,167,0.35), transparent)",
        }}
      />
      <div className="container relative z-10">
        <FadeIn>
          {hero.badgeKey ? (
            <span className="inline-block mb-6 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100 backdrop-blur-sm">
              {translate(hero.badgeKey)}
            </span>
          ) : null}
          <motion.h1
            className="max-w-4xl text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {headline}
          </motion.h1>
          <p className="mt-6 max-w-2xl text-lg text-blue-100/90 md:text-xl leading-relaxed">
            {subheadline}
          </p>
          <p className="mt-4 max-w-xl text-sm text-blue-200/80">
            {translate("solutions.shared.brandMessage")}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-4">
            {renderPrimary()}
            {renderSecondary()}
            {hero.tertiaryCta === "contact" && hero.tertiaryCtaKey ? (
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl text-white/90 font-medium px-6 py-3.5 text-sm underline-offset-4 hover:underline"
              >
                {translate(hero.tertiaryCtaKey)}
              </a>
            ) : null}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
