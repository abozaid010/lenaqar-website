"use client";

import { useI18n } from "@/hooks/useI18n";
import EgpAmount from "./egp-amount";
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
    <section className="container py-10">
      <h2 className="text-xl font-bold text-primary mb-6">
        {translate("lenaqar.comparison.title")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article className="rounded-lg border border-black/10 p-5 bg-white">
          <h3 className="font-semibold mb-4">
            {translate("lenaqar.comparison.cancelTitle")}
          </h3>
          <p className="text-sm text-black/60 mb-1">
            {translate("lenaqar.comparison.cancelPenalty")} ({penaltyPct}%)
          </p>
          <p className="text-lg font-semibold mb-3">
            <EgpAmount value={result.cancelPenalty} translate={translate} />
          </p>
          <p className="text-sm text-black/60 mb-1">
            {translate("lenaqar.comparison.cancelGets")}
          </p>
          <p className="text-2xl font-bold tabular-nums text-primary">
            <EgpAmount value={result.cancelReceives} translate={translate} />
          </p>
          <p className="text-sm text-black/60 mt-2">
            {translate("lenaqar.comparison.cancelTiming")}
          </p>
        </article>
        <article className="rounded-lg border border-primary/20 p-5 bg-primary/5">
          <h3 className="font-semibold mb-4">
            {translate("lenaqar.comparison.sellTitle")}
          </h3>
          <p className="text-sm text-black/60 mb-1">
            {translate("lenaqar.comparison.sellGets")}
          </p>
          <p className="text-2xl font-bold tabular-nums text-primary">
            <EgpAmount value={result.sellThroughUs} translate={translate} />
          </p>
          <p className="text-sm text-black/60 mt-2">
            {translate("lenaqar.comparison.sellTiming")}
          </p>
        </article>
      </div>
      <p className="text-sm text-black/60 mt-4">
        {translate("lenaqar.comparison.disclaimer")}
      </p>
    </section>
  );
}
