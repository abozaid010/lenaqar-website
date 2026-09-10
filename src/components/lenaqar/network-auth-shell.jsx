"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";

export default function NetworkAuthShell({
  titleKey,
  introKey,
  children,
}) {
  const { translate } = useI18n();

  return (
    <div className="container max-w-xl py-12 sm:py-16 pb-24 lg:pb-16">
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
      <div className="mt-8 rounded-2xl border border-primary/10 bg-white p-5 sm:p-6">
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
