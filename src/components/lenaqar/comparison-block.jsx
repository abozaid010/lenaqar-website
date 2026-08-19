"use client";

import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import EgpAmount from "./egp-amount";
import Link from "next/link";
import {
  ILLUSTRATIVE_CANCEL_PENALTY_RATE,
  WORKED_EXAMPLE_INPUTS,
  computeExitComparison,
} from "@/lib/lenaqar/exit-comparison";

export default function ComparisonBlock() {
  const { translate } = useI18n();
  const result = computeExitComparison(WORKED_EXAMPLE_INPUTS);

  if (!result) return null;

  const penaltyPct = Math.round(ILLUSTRATIVE_CANCEL_PENALTY_RATE * 100);

  return (
    <section className="container py-6 sm:py-8">
      <h2 className="text-base font-semibold text-primary mb-1">
        {translate("lenaqar.comparison.title")}
      </h2>
      <p className="text-xs text-black/55 mb-3">
        {translate("lenaqar.comparison.unitPrice")}:{" "}
        <EgpAmount value={result.unitPrice} translate={translate} />
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        <article className="rounded-md border border-black/10 p-3 bg-white">
          <h3 className="text-sm font-semibold mb-2">
            {translate("lenaqar.comparison.cancelTitle")}
          </h3>
          <p className="text-xs text-black/55 mb-0.5">
            {translate("lenaqar.comparison.cancelPenalty")} ({penaltyPct}%)
          </p>
          <p className="text-sm font-semibold mb-2 text-red-600">
            <EgpAmount value={result.cancelPenalty} translate={translate} />
          </p>
          <p className="text-xs text-black/55 mb-0.5">
            {translate("lenaqar.comparison.cancelGets")}
          </p>
          <p className="text-lg font-bold tabular-nums text-primary">
            <EgpAmount value={result.cancelReceives} translate={translate} />
          </p>
          <p className="text-xs text-black/50 mt-1">
            {translate("lenaqar.comparison.cancelTiming")}
          </p>
        </article>
        <article className="rounded-md border border-primary/15 p-3 bg-primary/[0.03]">
          <h3 className="text-sm font-semibold mb-2">
            {translate("lenaqar.comparison.sellTitle")}
          </h3>
          <p className="text-xs text-black/55 mb-0.5">
            {translate("lenaqar.comparison.sellGets")}
          </p>
          <p className="text-lg font-bold tabular-nums text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
            <EgpAmount value={result.sellThroughUs} translate={translate} />
          </p>
          <p className="text-xs text-black/50 mt-1">
            {translate("lenaqar.comparison.sellTiming")}
          </p>
        </article>
      </div>
      <p className="text-xs text-black/50 mt-3 max-w-3xl">
        {translate("lenaqar.comparison.disclaimer")}{" "}
        <Link
          href="/calculator"
          className="text-primary font-medium underline-offset-2 hover:underline"
        >
          {translate("lenaqar.home.primaryCta")}
        </Link>
      </p>
    </section>
  );
}
