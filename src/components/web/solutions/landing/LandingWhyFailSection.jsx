"use client";

import LandingInsight from "@/components/web/solutions/landing/LandingInsight";
import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import {
  LANDING_WHY_FAIL_APPROACHES,
  lk,
} from "@/content/solutions/landingConfig";
import { useI18n } from "@/hooks/useI18n";

export default function LandingWhyFailSection({ audience }) {
  const { translate } = useI18n();
  const approaches = LANDING_WHY_FAIL_APPROACHES[audience];

  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="container max-w-4xl">
        <FadeIn>
          <h2 className="text-2xl md:text-4xl font-bold text-primary leading-tight">
            {translate(lk(audience, "whyFail.title"))}
          </h2>
          <ul className="mt-10 space-y-4">
            {approaches.map((item) => (
              <li
                key={item}
                className="rounded-xl bg-white border border-slate-200 px-5 py-4 text-slate-700 shadow-sm"
              >
                {translate(lk(audience, `whyFail.approaches.${item}`))}
              </li>
            ))}
          </ul>
          <p className="mt-10 text-lg text-slate-600 leading-relaxed">
            {translate(lk(audience, "whyFail.conclusion"))}
          </p>
          <div className="mt-8">
            <LandingInsight>
              {translate(lk(audience, "whyFail.positioning"))}
            </LandingInsight>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
