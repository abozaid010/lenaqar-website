"use client";

import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import { CheckCircle2, Zap } from "lucide-react";

const CAPABILITY_KEYS = [
  "solutions.agencies.landing.solution.capabilities.instant",
  "solutions.agencies.landing.solution.capabilities.qualify",
  "solutions.agencies.landing.solution.capabilities.filter",
  "solutions.agencies.landing.solution.capabilities.route",
  "solutions.agencies.landing.solution.capabilities.coverage",
];

const NOT_KEYS = [
  "solutions.agencies.landing.solution.notItems.chatbot",
  "solutions.agencies.landing.solution.notItems.crm",
  "solutions.agencies.landing.solution.notItems.script",
];

const OUTCOME_KEYS = [
  "solutions.agencies.landing.solution.outcomes.ratio",
  "solutions.agencies.landing.solution.outcomes.overhead",
  "solutions.agencies.landing.solution.outcomes.roi",
  "solutions.agencies.landing.solution.outcomes.closing",
];

export default function AgenciesSolutionSection() {
  const { translate } = useI18n();

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container max-w-4xl">
        <FadeIn>
          <h2 className="text-2xl md:text-4xl font-bold text-primary leading-tight">
            {translate("solutions.agencies.landing.solution.title")}
          </h2>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            {translate("solutions.agencies.landing.solution.definition")}
          </p>
          <ul className="mt-10 space-y-3">
            {CAPABILITY_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
                <span className="text-slate-800">{translate(key)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-500 text-sm uppercase tracking-wider mb-4">
                {translate("solutions.agencies.landing.solution.notTitle")}
              </h3>
              <ul className="space-y-2 text-slate-600">
                {NOT_KEYS.map((key) => (
                  <li key={key}>✕ {translate(key)}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-primary text-white p-6 flex flex-col justify-center">
              <Zap className="h-8 w-8 text-[#21EAF4] mb-3" aria-hidden />
              <p className="text-lg font-semibold leading-snug">
                {translate("solutions.agencies.landing.solution.is")}
              </p>
            </div>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {OUTCOME_KEYS.map((key) => (
              <div
                key={key}
                className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800"
              >
                {translate(key)}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
