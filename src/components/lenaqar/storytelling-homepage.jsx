"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, ShieldCheck, Target, UserCheck, FileCheck } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { MARKETPLACE_CITY_FILTERS, requirementMatchesCity } from "@/lib/lenaqar/marketplace-city-filters";
import BuyRequestCta from "./buy-request-cta";
import RequirementCard from "./requirement-card";
import WhatsAppCta from "./whatsapp-cta";
import { useTypingEffect } from "./animations/use-typing-effect";
import { useAutoScroll } from "./animations/use-auto-scroll";
import { ScrollReveal } from "./animations/scroll-reveal";
import { actionButtonClass } from "@/components/ui/action-button-class";
import ActionButtonArrow from "@/components/ui/action-button-arrow";

export default function StorytellingHomepage({ requirements = [], error = null }) {
  const { translate } = useI18n();
  const [cityFilter, setCityFilter] = useState("");

  // Auto-scroll to Section 2 after 5 seconds
  useAutoScroll({
    delay: 5000,
    targetId: "who-we-are",
    enabled: true,
  });

  const filtered = requirements.filter((row) =>
    requirementMatchesCity(row, cityFilter)
  );

  // Display 4-6 requests initially
  const displayRequests = filtered.slice(0, 6);

  return (
    <>
      {/* Section 1 - Hero */}
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
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold tracking-wide text-primary sm:text-sm"
          >
            {translate("lenaqar.storytelling.hero.tagline")}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 max-w-4xl text-3xl font-bold leading-[1.25] text-primary sm:mt-5 sm:text-4xl lg:text-5xl"
          >
            {translate("lenaqar.storytelling.hero.headline")}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-5 max-w-2xl text-lg leading-relaxed text-black/75 sm:text-xl"
          >
            {useTypingEffect(translate("lenaqar.storytelling.hero.whoWeAre"), {
              speed: 40,
              delay: 600,
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-3 max-w-2xl text-base leading-relaxed text-black/65 sm:text-lg"
          >
            {translate("lenaqar.storytelling.hero.whoWeAreDetail")}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <BuyRequestCta
              variant="primary"
              label={translate("lenaqar.storytelling.hero.primaryCta")}
              className="!px-6 !py-3.5 !text-base font-bold"
            />
            <Link
              href="/how-it-works"
              className={actionButtonClass({ variant: "secondary" })}
            >
              {translate("lenaqar.storytelling.hero.secondaryCta")}
              <ActionButtonArrow />
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            className="mt-12 flex flex-col items-center gap-2"
          >
            <span className="text-sm text-black/50">
              {translate("lenaqar.storytelling.hero.scrollHint")}
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center pt-2"
            >
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-primary rounded-full"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section 2 - Who We Are (placeholder for auto-scroll) */}
      <section id="who-we-are" className="container py-8 sm:py-10">
        <ScrollReveal>
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">
            إزاي بنساعدك؟
          </h2>
        </ScrollReveal>
      </section>

      {/* Section 3 - Why LenaQar */}
      <section id="why-lenaqar" className="container py-8 sm:py-10">
        <ScrollReveal>
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">
            {translate("lenaqar.storytelling.why.title")}
          </h2>
        </ScrollReveal>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ScrollReveal delay={0.15}>
            <article className="rounded-xl border border-primary/10 bg-white p-4">
              <div className="flex items-start gap-3">
                <Target className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-primary">
                    {translate("lenaqar.storytelling.why.point1Title")}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-black/70 line-clamp-2">
                    {translate("lenaqar.storytelling.why.point1Body")}
                  </p>
                </div>
              </div>
            </article>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <article className="rounded-xl border border-primary/10 bg-white p-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-primary">
                    {translate("lenaqar.storytelling.why.point2Title")}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-black/70 line-clamp-2">
                    {translate("lenaqar.storytelling.why.point2Body")}
                  </p>
                </div>
              </div>
            </article>
          </ScrollReveal>
          <ScrollReveal delay={0.45}>
            <article className="rounded-xl border border-primary/10 bg-white p-4">
              <div className="flex items-start gap-3">
                <UserCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-primary">
                    {translate("lenaqar.storytelling.why.point3Title")}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-black/70 line-clamp-2">
                    {translate("lenaqar.storytelling.why.point3Body")}
                  </p>
                </div>
              </div>
            </article>
          </ScrollReveal>
          <ScrollReveal delay={0.6}>
            <article className="rounded-xl border border-primary/10 bg-white p-4">
              <div className="flex items-start gap-3">
                <FileCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-primary">
                    {translate("lenaqar.storytelling.why.point4Title")}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-black/70 line-clamp-2">
                    {translate("lenaqar.storytelling.why.point4Body")}
                  </p>
                </div>
              </div>
            </article>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 4 - How It Works */}
      <section className="border-y border-primary/10 bg-[#f7f6f2] py-8 sm:py-10">
        <div className="container">
          <ScrollReveal>
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">
              {translate("lenaqar.storytelling.how.title")}
            </h2>
          </ScrollReveal>

          <div className="mt-6 space-y-4">
            {[1, 2, 3, 4].map((step) => (
              <ScrollReveal key={step} delay={step * 0.1}>
                <div className="flex items-start gap-4 sm:gap-6">
                  {/* Step Number Circle */}
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm sm:text-base">
                    {step}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pt-1">
                    <h3 className="font-bold text-base sm:text-lg text-primary">
                      {translate(`lenaqar.storytelling.how.step${step}Title`)}
                    </h3>
                    <p className="mt-1 text-sm sm:text-base text-black/70 leading-relaxed">
                      {translate(`lenaqar.storytelling.how.step${step}Body`)}
                    </p>
                  </div>

                  {/* Connector Line */}
                  {step < 4 && (
                    <div className="hidden sm:block flex-shrink-0 w-0.5 min-h-12 bg-primary/20 -mt-2" />
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.5}>
            <div className="mt-8 text-center">
              <BuyRequestCta
                variant="primary"
                label={translate("lenaqar.storytelling.how.cta")}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Section 5 - Real Buying Requests */}
      <section className="container py-10 sm:py-14">
        <ScrollReveal>
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">
            {translate("lenaqar.storytelling.requests.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-base text-black/70">
            {translate("lenaqar.storytelling.requests.subtitle")}
          </p>
        </ScrollReveal>

        {error ? (
          <ScrollReveal delay={0.2}>
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
          </ScrollReveal>
        ) : displayRequests.length === 0 ? (
          <ScrollReveal delay={0.2}>
            <div className="mt-8 rounded-2xl border border-primary/10 bg-primary/[0.03] p-6">
              <p className="font-semibold text-primary">
                {translate("lenaqar.storytelling.requests.empty")}
              </p>
              <div className="mt-4">
                <BuyRequestCta variant="primary" />
              </div>
            </div>
          </ScrollReveal>
        ) : (
          <>
            <ScrollReveal delay={0.2}>
              <div className="-mb-4 mt-6 columns-1 gap-4 md:columns-2 xl:columns-3">
                {displayRequests.map((requirement) => (
                  <RequirementCard
                    key={requirement.id}
                    requirement={requirement}
                  />
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="mt-8 text-center">
                <Link
                  href="/opportunities"
                  className={actionButtonClass({ variant: "secondary" })}
                >
                  {translate("lenaqar.storytelling.requests.seeAll")}
                  <ActionButtonArrow />
                </Link>
              </div>
            </ScrollReveal>
          </>
        )}
      </section>
    </>
  );
}
