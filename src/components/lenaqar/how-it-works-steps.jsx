"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";

export default function HowItWorksSteps({ variant = "compact", showSellLink = true }) {
  const { translate } = useI18n();
  const isFull = variant === "full";

  return (
    <section className={isFull ? "space-y-6" : "container py-10"}>
      {!isFull ? (
        <h2 className="text-xl font-bold text-primary mb-6">
          {translate("lenaqar.home.howTitle")}
        </h2>
      ) : null}
      <ol
        className={
          isFull
            ? "space-y-4"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        }
      >
        {[1, 2, 3, 4].map((step) => (
          <li
            key={step}
            className="rounded-lg border border-black/10 p-5 bg-white"
          >
            <p className="text-xs text-black/50 mb-2 tabular-nums">{step}</p>
            <h3 className="font-semibold mb-2">
              {step === 4 ? (
                <>
                  {translate("lenaqar.home.howStep4TitleBefore")}
                  <span className="font-extrabold text-red-600">
                    {translate("lenaqar.home.howStep4TitleHighlight")}
                  </span>
                </>
              ) : (
                translate(`lenaqar.home.howStep${step}Title`)
              )}
            </h3>
            <p className="text-sm text-black/70">
              {translate(`lenaqar.home.howStep${step}Body`)}
            </p>
          </li>
        ))}
      </ol>
      {showSellLink && !isFull ? (
        <div className="mt-6">
          <Link
            href="/sell"
            className="text-sm text-primary font-medium underline-offset-2 hover:underline"
          >
            {translate("lenaqar.home.sellLearnMore")}
          </Link>
        </div>
      ) : null}
      {isFull ? (
        <div className="pt-2">
          <Link
            href="/sell"
            className="inline-flex items-center justify-center rounded-md bg-primary text-white font-medium px-4 py-3 text-sm min-h-11"
          >
            {translate("lenaqar.howItWorks.sellCta")}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
