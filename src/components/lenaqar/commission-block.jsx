"use client";

import { Check, HandCoins, Users } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import CoreActions from "./core-actions";

const SIDES = [
  { key: "seller", Icon: HandCoins },
  { key: "buyer", Icon: Users },
];

const POINTS = ["point1", "point2", "point3"];

export default function CommissionBlock() {
  const { translate } = useI18n();

  return (
    <section className="container py-10 sm:py-14">
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary">
          {translate("lenaqar.commission.title")}
        </h2>
        <p className="mt-2 text-base text-black/65 max-w-2xl">
          {translate("lenaqar.commission.sub")}
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SIDES.map(({ key, Icon }) => (
            <article
              key={key}
              className="rounded-xl border border-black/10 bg-white p-5 shadow-sm"
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-black/60">
                <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {translate(`lenaqar.commission.${key}Label`)}
              </p>
              <p className="mt-2 text-4xl font-extrabold text-primary tabular-nums">
                {translate("lenaqar.commission.rate")}
              </p>
              <p className="mt-1 text-sm text-black/55">
                {translate("lenaqar.commission.ofSalePrice")}
              </p>
            </article>
          ))}
        </div>

        <ul className="mt-6 space-y-2.5">
          {POINTS.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-black/80">
              <Check
                className="size-4 shrink-0 mt-0.5 text-emerald-600"
                aria-hidden="true"
              />
              {translate(`lenaqar.commission.${point}`)}
            </li>
          ))}
        </ul>

        <CoreActions className="mt-7 max-w-md" />

        <p className="mt-4 text-xs text-black/50">
          {translate("lenaqar.commission.note")}
        </p>
      </div>
    </section>
  );
}
