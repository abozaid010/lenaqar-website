"use client";

import LandingInsight from "@/components/web/solutions/landing/LandingInsight";
import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import {
  LANDING_PARTNERSHIP_KEYS,
  lk,
} from "@/content/solutions/landingConfig";
import { useI18n } from "@/hooks/useI18n";
import { getWhatsAppUrl } from "@/lib/solutions/links";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const ctaClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold px-10 py-4 text-base shadow-lg hover:opacity-95 transition-opacity";

export default function LandingPartnershipSection({ audience }) {
  const { translate } = useI18n();
  const keys = LANDING_PARTNERSHIP_KEYS[audience];
  const partnerMsg = translate(`solutions.${audience}.partnerMessage`);

  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="container max-w-4xl">
        <FadeIn>
          <h2 className="text-2xl md:text-4xl font-bold text-primary leading-tight">
            {translate(lk(audience, "partnership.title"))}
          </h2>
          <div className="mt-10">
            <LandingInsight>
              {translate(lk(audience, "partnership.message"))}
            </LandingInsight>
          </div>
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
              <h3 className="font-bold text-red-900 mb-4">
                {translate(lk(audience, "partnership.withoutTitle"))}
              </h3>
              <ul className="space-y-2 text-red-900/80 text-sm">
                {keys.withoutItems.map((item) => (
                  <li key={item}>
                    • {translate(lk(audience, `partnership.withoutItems.${item}`))}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-primary bg-primary/5 p-6">
              <h3 className="font-bold text-primary mb-4">
                {translate(lk(audience, "partnership.withTitle"))}
              </h3>
              <ul className="space-y-2 text-slate-800 text-sm font-medium">
                {keys.withItems.map((item) => (
                  <li key={item}>
                    • {translate(lk(audience, `partnership.withItems.${item}`))}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-6 text-center">
              {translate(lk(audience, "partnership.proofTitle"))}
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {keys.proof.map((item) => (
                <div
                  key={item}
                  className="rounded-xl bg-white border border-slate-200 p-5 text-center shadow-sm"
                >
                  <p className="text-lg md:text-xl font-bold text-primary">
                    {translate(lk(audience, `partnership.proof.${item}`))}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <ul className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-slate-600">
            {keys.audiences.map((item) => (
              <li
                key={item}
                className="px-4 py-2 rounded-full bg-white border border-slate-200"
              >
                {translate(lk(audience, `partnership.audiences.${item}`))}
              </li>
            ))}
          </ul>
          <div className="mt-12 text-center">
            {audience === "brokers" ? (
              <Link href="/login" className={ctaClass}>
                {translate(lk(audience, "partnership.cta"))}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            ) : (
              <a
                href={getWhatsAppUrl(partnerMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className={ctaClass}
              >
                {translate(lk(audience, "partnership.cta"))}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </a>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
