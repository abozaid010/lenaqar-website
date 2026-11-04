"use client";

import { useI18n } from "@/hooks/useI18n";

const STEPS = [1, 2, 3, 4];

export default function MarketplaceHowItWorks() {
  const { translate } = useI18n();

  return (
    <section className="container py-8 sm:py-10">
      <h2 className="text-2xl sm:text-3xl font-bold text-primary">
        {translate("lenaqar.marketplace.how.title")}
      </h2>
      <p className="mt-2 max-w-2xl text-base text-black/70">
        {translate("lenaqar.marketplace.how.sub")}
      </p>
      <ol className="mt-6 space-y-4">
        {STEPS.map((step) => (
          <li
            key={step}
            className="flex items-start gap-4 sm:gap-6"
          >
            {/* Step Number Circle */}
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm sm:text-base">
              {step}
            </div>

            {/* Step Content */}
            <div className="flex-1 pt-1">
              <h3 className="font-bold text-base sm:text-lg text-primary">
                {translate(`lenaqar.marketplace.how.step${step}Title`)}
              </h3>
              <p className="mt-1 text-sm sm:text-base text-black/70 leading-relaxed">
                {translate(`lenaqar.marketplace.how.step${step}Body`)}
              </p>
            </div>

            {/* Connector Line */}
            {step < 4 && (
              <div className="hidden sm:block flex-shrink-0 w-0.5 min-h-12 bg-primary/20 -mt-2" />
            )}
          </li>
        ))}
      </ol>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-black/70">
        {translate("lenaqar.marketplace.how.waitingNote")}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/60">
        {translate("lenaqar.marketplace.how.privacyNote")}
      </p>
    </section>
  );
}
