"use client";

import AgenciesInsight from "@/components/web/solutions/agencies/landing/AgenciesInsight";
import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import { getWhatsAppUrl } from "@/lib/solutions/links";
import { ArrowRight } from "lucide-react";

export default function AgenciesPartnershipSection() {
  const { translate } = useI18n();
  const partnerMsg = translate("solutions.agencies.partnerMessage");

  const withoutKeys = [
    "solutions.agencies.landing.partnership.withoutItems.volume",
    "solutions.agencies.landing.partnership.withoutItems.quality",
    "solutions.agencies.landing.partnership.withoutItems.conversion",
    "solutions.agencies.landing.partnership.withoutItems.cost",
  ];
  const withKeys = [
    "solutions.agencies.landing.partnership.withItems.qualification",
    "solutions.agencies.landing.partnership.withItems.response",
    "solutions.agencies.landing.partnership.withItems.spend",
    "solutions.agencies.landing.partnership.withItems.conversations",
  ];
  const proofKeys = [
    "solutions.agencies.landing.partnership.proof.calls",
    "solutions.agencies.landing.partnership.proof.volume",
    "solutions.agencies.landing.partnership.proof.transactions",
  ];
  const audienceKeys = [
    "solutions.agencies.landing.partnership.audiences.agencies",
    "solutions.agencies.landing.partnership.audiences.developers",
    "solutions.agencies.landing.partnership.audiences.brokers",
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="container max-w-4xl">
        <FadeIn>
          <h2 className="text-2xl md:text-4xl font-bold text-primary leading-tight">
            {translate("solutions.agencies.landing.partnership.title")}
          </h2>
          <div className="mt-10">
            <AgenciesInsight>
              {translate("solutions.agencies.landing.partnership.message")}
            </AgenciesInsight>
          </div>
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
              <h3 className="font-bold text-red-900 mb-4">
                {translate("solutions.agencies.landing.partnership.withoutTitle")}
              </h3>
              <ul className="space-y-2 text-red-900/80 text-sm">
                {withoutKeys.map((key) => (
                  <li key={key}>• {translate(key)}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-primary bg-primary/5 p-6">
              <h3 className="font-bold text-primary mb-4">
                {translate("solutions.agencies.landing.partnership.withTitle")}
              </h3>
              <ul className="space-y-2 text-slate-800 text-sm font-medium">
                {withKeys.map((key) => (
                  <li key={key}>• {translate(key)}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-6 text-center">
              {translate("solutions.agencies.landing.partnership.proofTitle")}
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {proofKeys.map((key) => (
                <div
                  key={key}
                  className="rounded-xl bg-white border border-slate-200 p-5 text-center shadow-sm"
                >
                  <p className="text-lg md:text-xl font-bold text-primary">{translate(key)}</p>
                </div>
              ))}
            </div>
          </div>
          <ul className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-slate-600">
            {audienceKeys.map((key) => (
              <li key={key} className="px-4 py-2 rounded-full bg-white border border-slate-200">
                {translate(key)}
              </li>
            ))}
          </ul>
          <div className="mt-12 text-center">
            <a
              href={getWhatsAppUrl(partnerMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold px-10 py-4 text-base shadow-lg hover:opacity-95 transition-opacity"
            >
              {translate("solutions.agencies.landing.partnership.cta")}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
