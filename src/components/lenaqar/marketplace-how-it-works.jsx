"use client";

import { useI18n } from "@/hooks/useI18n";

const STEPS = [1, 2, 3, 4];

export default function MarketplaceHowItWorks() {
  const { translate } = useI18n();

  return (
    <section className="container py-12 sm:py-16">
      <h2 className="text-2xl sm:text-3xl font-bold text-primary">
        {translate("lenaqar.marketplace.how.title")}
      </h2>
      <p className="mt-2 max-w-2xl text-base text-black/70">
        {translate("lenaqar.marketplace.how.sub")}
      </p>
      <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <li
            key={step}
            className="rounded-2xl border border-primary/10 bg-white/80 p-5"
          >
            <p className="text-xs font-semibold tabular-nums text-primary/50">
              {String(step).padStart(2, "0")}
            </p>
            <h3 className="mt-2 font-bold text-primary">
              {translate(`lenaqar.marketplace.how.step${step}Title`)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-black/70">
              {translate(`lenaqar.marketplace.how.step${step}Body`)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
