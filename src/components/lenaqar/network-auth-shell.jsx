"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";

export default function NetworkAuthShell({
  titleKey,
  introKey,
  benefitsTitleKey,
  benefits,
  reviewKey,
  children,
}) {
  const { translate } = useI18n();
  const showNotes = Boolean(benefits?.length || reviewKey);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-8 pb-10 sm:px-6 sm:pt-12 sm:pb-16">
      <p className="text-xs font-semibold tracking-wide text-primary">
        {translate("lenaqar.network.landing.eyebrow")}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
        {translate(titleKey)}
      </h1>
      {introKey ? (
        <p className="mt-3 text-base leading-relaxed text-black/70">
          {translate(introKey)}
        </p>
      ) : null}
      {showNotes ? (
        <div className="mt-5 space-y-3">
          {benefits?.length ? (
            <section
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
              aria-labelledby="network-signup-benefits"
            >
              {benefitsTitleKey ? (
                <h2
                  id="network-signup-benefits"
                  className="text-base font-semibold text-emerald-900"
                >
                  {translate(benefitsTitleKey)}
                </h2>
              ) : null}
              <ul className="mt-3 space-y-3">
                {benefits.map((item) => (
                  <li key={item.titleKey}>
                    <p className="text-sm font-semibold text-emerald-950">
                      {translate(item.titleKey)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-emerald-950/80">
                      {translate(item.bodyKey)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {reviewKey ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-relaxed text-red-800">
              {translate(reviewKey)}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-6 rounded-2xl border border-primary/10 bg-white p-4 sm:p-6">
        {children}
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/network" className="text-primary underline">
          {translate("lenaqar.network.pending.back")}
        </Link>
      </p>
    </div>
  );
}
