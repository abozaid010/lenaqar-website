"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { localizedPlaceName } from "@/lib/lenaqar/place-display";
import { matchRequestHref } from "@/lib/lenaqar/whatsapp";
import { loadBuyRequestPriceInsight } from "@/app/(lenaqar)/_actions/buy-request";
import EgpAmount from "./egp-amount";

/**
 * Success screen of the buy request.
 *
 * 1. Average asking prices for what the buyer just asked for. Loaded after the
 *    card is on screen; when the backend has too few listed units (or does not
 *    answer) the block is simply absent — never an error, never a guess.
 * 2. One WhatsApp button with a fixed message. The backend recognises it and
 *    replies with the buyer's match link, so the phone that submitted the form
 *    is the one that receives the units.
 */
export default function BuyRequestSuccess({
  requirement,
  opportunitiesHref = "/opportunities",
  onAnother,
  trackingLocation = "buy_request_success",
  // A dialog already prints the title in its header.
  showTitle = true,
  className = "",
}) {
  const { translate, locale } = useI18n();
  const t = (key) => translate(`lenaqar.onboarding.${key}`);
  // undefined = still loading, null = nothing to show.
  const [insight, setInsight] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    setInsight(undefined);
    loadBuyRequestPriceInsight(requirement)
      .then((view) => {
        if (!cancelled) setInsight(view || null);
      })
      .catch(() => {
        if (!cancelled) setInsight(null);
      });
    return () => {
      cancelled = true;
    };
  }, [requirement]);

  const place = insight ? localizedPlaceName(insight.place.en, insight.place.ar, locale) : "";
  const typeLabel = insight?.propertyType
    ? translate(`buildingTypes.${insight.propertyType}`, insight.propertyType)
    : "";

  return (
    <div
      role="status"
      className={`rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 text-center sm:p-6 ${className}`}
    >
      <CheckCircle2 aria-hidden="true" className="mx-auto size-9 text-emerald-600" />
      {showTitle ? (
        <p className="mt-2 text-lg font-bold text-primary">{t("successTitle")}</p>
      ) : null}
      <p className="mt-1 text-sm text-black/70 sm:text-base">{t("successBody")}</p>

      {insight === undefined ? (
        <div
          aria-hidden="true"
          className="mx-auto mt-4 h-28 w-full max-w-md animate-pulse rounded-2xl bg-white/70"
        />
      ) : null}

      {insight ? (
        <section
          aria-label={t("successPriceTitle").replace("{place}", place)}
          className="mx-auto mt-4 w-full max-w-md rounded-2xl border border-primary/10 bg-white p-4 text-start"
        >
          <h3 className="text-sm font-bold text-primary sm:text-base">
            {t("successPriceTitle").replace("{place}", place)}
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <dt className="text-xs text-black/60">{t("successPricePerMeter")}</dt>
              <dd className="mt-0.5 text-base font-bold text-primary sm:text-lg">
                <EgpAmount value={insight.perMeter} translate={translate} />
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-black/60">{t("successPriceTotal")}</dt>
              <dd className="mt-0.5 text-base font-bold text-primary sm:text-lg">
                <EgpAmount value={insight.avgTotal} translate={translate} />
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-black/70 sm:text-sm">
            {t("successPriceFrom")}{" "}
            <EgpAmount value={insight.lowest} translate={translate} className="font-semibold" />{" "}
            {t("successPriceTo")}{" "}
            <EgpAmount value={insight.highest} translate={translate} className="font-semibold" />
          </p>
          <p className="mt-2 text-xs text-black/55">
            {typeLabel ? `${typeLabel} · ` : ""}
            {t("successPriceBasis").replace("{count}", String(insight.count))}
            {insight.asOf ? (
              <>
                {" · "}
                <span dir="ltr" className="inline-block whitespace-nowrap tabular-nums">
                  {insight.asOf}
                </span>
              </>
            ) : null}
          </p>
        </section>
      ) : null}

      <div className="mx-auto mt-4 flex w-full max-w-md flex-col items-stretch gap-2">
        <a
          href={matchRequestHref()}
          target="_blank"
          rel="noopener noreferrer"
          data-cta-intent="buy"
          data-cta-location={trackingLocation}
          className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-base font-bold text-white shadow-lg shadow-[#25D366]/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#20BA5A] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50 focus-visible:ring-offset-2"
        >
          <MessageCircle aria-hidden="true" className="size-5 shrink-0" />
          {t("successWhatsapp")}
        </a>
        <p className="text-xs text-black/55">{t("successWhatsappHint")}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
        <Link
          href={opportunitiesHref}
          className="compact-btn inline-flex items-center rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {t("successMatches")}
        </Link>
        {onAnother ? (
          <button
            type="button"
            onClick={onAnother}
            className="compact-btn inline-flex items-center rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {t("successAnother")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
