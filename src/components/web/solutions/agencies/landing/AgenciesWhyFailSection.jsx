"use client";

import AgenciesInsight from "@/components/web/solutions/agencies/landing/AgenciesInsight";
import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";

const APPROACH_KEYS = [
  "solutions.agencies.landing.whyFail.approaches.hiring",
  "solutions.agencies.landing.whyFail.approaches.chatbots",
  "solutions.agencies.landing.whyFail.approaches.manual",
  "solutions.agencies.landing.whyFail.approaches.crm",
];

export default function AgenciesWhyFailSection() {
  const { translate } = useI18n();

  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="container max-w-4xl">
        <FadeIn>
          <h2 className="text-2xl md:text-4xl font-bold text-primary leading-tight">
            {translate("solutions.agencies.landing.whyFail.title")}
          </h2>
          <ul className="mt-10 space-y-4">
            {APPROACH_KEYS.map((key) => (
              <li
                key={key}
                className="rounded-xl bg-white border border-slate-200 px-5 py-4 text-slate-700 shadow-sm"
              >
                {translate(key)}
              </li>
            ))}
          </ul>
          <p className="mt-10 text-lg text-slate-600 leading-relaxed">
            {translate("solutions.agencies.landing.whyFail.conclusion")}
          </p>
          <div className="mt-8">
            <AgenciesInsight>
              {translate("solutions.agencies.landing.whyFail.positioning")}
            </AgenciesInsight>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
