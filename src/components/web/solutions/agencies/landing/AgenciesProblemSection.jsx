"use client";

import AgenciesInsight from "@/components/web/solutions/agencies/landing/AgenciesInsight";
import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import { Check, X } from "lucide-react";

export default function AgenciesProblemSection() {
  const { translate } = useI18n();

  const optimizeKeys = [
    "solutions.agencies.landing.problem.optimizeItems.ctr",
    "solutions.agencies.landing.problem.optimizeItems.cpl",
    "solutions.agencies.landing.problem.optimizeItems.reach",
  ];
  const ignoreKeys = [
    "solutions.agencies.landing.problem.ignoreItems.response",
    "solutions.agencies.landing.problem.ignoreItems.qualification",
    "solutions.agencies.landing.problem.ignoreItems.readiness",
    "solutions.agencies.landing.problem.ignoreItems.automation",
  ];
  const happensKeys = [
    "solutions.agencies.landing.problem.happensItems.qualified",
    "solutions.agencies.landing.problem.happensItems.waste",
    "solutions.agencies.landing.problem.happensItems.noise",
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container max-w-4xl">
        <FadeIn>
          <h2 className="text-2xl md:text-4xl font-bold text-primary leading-tight">
            {translate("solutions.agencies.landing.problem.title")}
          </h2>
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="font-semibold text-slate-500 uppercase text-xs tracking-wider mb-4">
                {translate("solutions.agencies.landing.problem.optimizeTitle")}
              </h3>
              <ul className="space-y-2">
                {optimizeKeys.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-slate-700">
                    <Check className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
                    {translate(key)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
              <h3 className="font-semibold text-primary uppercase text-xs tracking-wider mb-4">
                {translate("solutions.agencies.landing.problem.ignoreTitle")}
              </h3>
              <ul className="space-y-2">
                {ignoreKeys.map((key) => (
                  <li key={key} className="flex items-center gap-2 text-slate-800 font-medium">
                    <X className="h-4 w-4 text-red-500 shrink-0" aria-hidden />
                    {translate(key)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 rounded-2xl border border-slate-200 p-6 md:p-8">
            <h3 className="font-bold text-lg text-slate-900 mb-4">
              {translate("solutions.agencies.landing.problem.happensTitle")}
            </h3>
            <ul className="space-y-3 text-slate-600">
              {happensKeys.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  {translate(key)}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-10">
            <AgenciesInsight>
              {translate("solutions.agencies.landing.problem.insight")}
            </AgenciesInsight>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
