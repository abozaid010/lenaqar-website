"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { ANALYTICS } from "@/constants/analytics";
import { sellerCtaHref } from "@/lib/lenaqar/whatsapp";
import {
  ILLUSTRATIVE_CANCEL_PENALTY_RATE,
  computeExitComparison,
} from "@/lib/lenaqar/exit-comparison";
import { formatEgpNumber } from "@/lib/lenaqar/metrics";
import EgpAmount from "./egp-amount";
import WhatsAppCta from "./whatsapp-cta";

function digitsOnly(raw) {
  return String(raw ?? "").replace(/\D/g, "");
}

function EgpPriceInput({ value, onChange, required, translate }) {
  const display = value === "" ? "" : formatEgpNumber(value) || "";

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        value={display}
        onChange={(event) => onChange(digitsOnly(event.target.value))}
        className="w-full border border-black/15 rounded-md px-3 py-2 pe-12 tabular-nums"
      />
      <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm text-black/50">
        {translate("lenaqar.unit.egp")}
      </span>
    </div>
  );
}

export default function ExitCalculator() {
  const { translate } = useI18n();
  const { trackEvent } = useGoogleAnalytics();
  const [unitPrice, setUnitPrice] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    if (!submitted) return null;
    return computeExitComparison({
      unitPrice,
      amountPaid,
    });
  }, [submitted, unitPrice, amountPaid]);

  const penaltyPct = Math.round(ILLUSTRATIVE_CANCEL_PENALTY_RATE * 100);

  return (
    <div className="max-w-xl">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          const next = computeExitComparison({ unitPrice, amountPaid });
          if (next) {
            trackEvent(ANALYTICS.EVENTS.CALCULATOR_USED, {
              unit_price: Number(unitPrice),
              amount_paid: Number(amountPaid),
            });
          }
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span>{translate("lenaqar.calculator.unitPrice")}</span>
          <EgpPriceInput
            value={unitPrice}
            required
            translate={translate}
            onChange={(next) => {
              setUnitPrice(next);
              setSubmitted(false);
            }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{translate("lenaqar.calculator.amountPaid")}</span>
          <EgpPriceInput
            value={amountPaid}
            required
            translate={translate}
            onChange={(next) => {
              setAmountPaid(next);
              setSubmitted(false);
            }}
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-primary text-white font-medium py-3 px-4 text-sm"
        >
          {translate("lenaqar.calculator.submit")}
        </button>
      </form>

      {submitted && !result ? (
        <p className="text-sm text-red-600 mt-4">
          {translate("lenaqar.calculator.invalid")}
        </p>
      ) : null}

      {result ? (
        <div className="mt-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <article className="rounded-lg border border-black/10 p-4">
              <h3 className="font-semibold mb-3">
                {translate("lenaqar.calculator.cancelLabel")}
              </h3>
              <p className="text-xs text-black/60 mb-1">
                {translate("lenaqar.calculator.penalty")} ({penaltyPct}%)
              </p>
              <p className="mb-3 text-red-600 font-semibold">
                <EgpAmount value={result.cancelPenalty} translate={translate} />
              </p>
              <p className="text-xs text-black/60 mb-1">
                {translate("lenaqar.calculator.youGet")}
              </p>
              <p className="text-2xl font-bold text-primary">
                <EgpAmount value={result.cancelReceives} translate={translate} />
              </p>
              <p className="text-xs text-black/60 mt-2">
                {translate("lenaqar.calculator.overYears").replace(
                  "{years}",
                  String(result.refundYears)
                )}
              </p>
            </article>
            <article className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="font-semibold mb-3">
                {translate("lenaqar.calculator.sellLabel")}
              </h3>
              <p className="text-xs text-black/60 mb-1">
                {translate("lenaqar.calculator.youGet")}
              </p>
              <p className="text-2xl font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="size-6 shrink-0" aria-hidden="true" />
                <EgpAmount value={result.sellThroughUs} translate={translate} />
              </p>
            </article>
          </div>
          <p className="text-sm text-black/60">
            {translate("lenaqar.calculator.disclaimer")}
          </p>
          <WhatsAppCta
            href={sellerCtaHref()}
            eventName={ANALYTICS.EVENTS.SELLER_WHATSAPP_CLICKED}
            className="w-full sm:w-auto"
          >
            {translate("lenaqar.calculator.cta")}
          </WhatsAppCta>
        </div>
      ) : null}
    </div>
  );
}
