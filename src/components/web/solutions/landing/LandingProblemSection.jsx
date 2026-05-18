"use client";

import LandingInsight from "@/components/web/solutions/landing/LandingInsight";
import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import {
  LANDING_PROBLEM_KEYS,
  lk,
} from "@/content/solutions/landingConfig";
import { useI18n } from "@/hooks/useI18n";
import { Check, X } from "lucide-react";

export default function LandingProblemSection({ audience }) {
  const { translate } = useI18n();
  const keys = LANDING_PROBLEM_KEYS[audience];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container max-w-4xl">
        <FadeIn>
          <h2 className="text-2xl md:text-4xl font-bold text-primary leading-tight">
            {translate(lk(audience, "problem.title"))}
          </h2>
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="font-semibold text-slate-500 uppercase text-xs tracking-wider mb-4">
                {translate(lk(audience, "problem.optimizeTitle"))}
              </h3>
              <ul className="space-y-2">
                {keys.optimizeItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-slate-700"
                  >
                    <Check className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
                    {translate(lk(audience, `problem.optimizeItems.${item}`))}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6">
              <h3 className="font-semibold text-primary uppercase text-xs tracking-wider mb-4">
                {translate(lk(audience, "problem.ignoreTitle"))}
              </h3>
              <ul className="space-y-2">
                {keys.ignoreItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-slate-800 font-medium"
                  >
                    <X className="h-4 w-4 text-red-500 shrink-0" aria-hidden />
                    {translate(lk(audience, `problem.ignoreItems.${item}`))}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 rounded-2xl border border-slate-200 p-6 md:p-8">
            <h3 className="font-bold text-lg text-slate-900 mb-4">
              {translate(lk(audience, "problem.happensTitle"))}
            </h3>
            <ul className="space-y-3 text-slate-600">
              {keys.happensItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  {translate(lk(audience, `problem.happensItems.${item}`))}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-10">
            <LandingInsight>
              {translate(lk(audience, "problem.insight"))}
            </LandingInsight>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
