"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { recordUnitInterest } from "@/app/(lenaqar)/_actions/buy-request";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";
import { readMatchRef } from "@/lib/lenaqar/buy-request-identity";
import { placeAr, roomsLabelAr } from "@/lib/lenaqar/listing-seo";
import { formatEgpNumber } from "@/lib/lenaqar/metrics";
import { localizedPlaceName } from "@/lib/lenaqar/place-display";
import { placeKey } from "@/lib/lenaqar/request-places";
import { matchRequestHref, matchUnitHref } from "@/lib/lenaqar/whatsapp";
import BuyRequestCta, { BUY_REQUEST_USER_ID_KEY } from "./buy-request-cta";
import OpportunityCard from "./opportunity-card";
import WhatsAppCta from "./whatsapp-cta";

const CALL_HREF = `tel:${LENAQAR_CONTACT.phoneE164}`;

const callClass =
  "inline-flex items-center justify-center gap-2 rounded-md border-2 border-primary bg-white px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

const summaryChipClass =
  "inline-flex min-h-8 items-center rounded-full bg-primary/5 px-3 text-sm text-primary";

/** True when this browser submitted the request the page shows. */
function useOwnsRequest(matchRef) {
  const [owns, setOwns] = useState(false);
  useEffect(() => {
    try {
      const storage = window.localStorage;
      const userId = String(storage.getItem(BUY_REQUEST_USER_ID_KEY) || "").trim();
      setOwns(Boolean(matchRef) && readMatchRef(storage, userId) === matchRef);
    } catch {
      setOwns(false);
    }
  }, [matchRef]);
  return owns;
}

function CallLink({ location, unitCode, className = "", children }) {
  return (
    <a
      href={CALL_HREF}
      data-cta-intent="call"
      data-cta-location={location}
      data-unit-code={unitCode}
      className={`${callClass} ${className}`}
    >
      <Phone aria-hidden="true" className="size-4 shrink-0" />
      {children}
    </a>
  );
}

function Notice({ title, body, children }) {
  return (
    <div className="container py-10 sm:py-14">
      <div className="mx-auto max-w-xl rounded-2xl border border-black/10 bg-white p-6 text-center">
        <h1 className="lq-display text-xl font-bold text-primary sm:text-2xl">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-black/70">{body}</p>
        <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function RequestMatchContent({ result }) {
  const { translate, locale } = useI18n();
  const t = (key) => translate(`lenaqar.matchPage.${key}`);
  const matchRef = result?.matchRef || "";
  const ownsRequest = useOwnsRequest(matchRef);

  if (result?.status === "not_found") {
    return (
      <Notice title={t("notFoundTitle")} body={t("notFoundBody")}>
        <BuyRequestCta label={t("newRequest")} trackingLocation="match_page_not_found" />
      </Notice>
    );
  }

  if (result?.status !== "ok") {
    return (
      <Notice title={t("unavailableTitle")} body={t("unavailableBody")}>
        <WhatsAppCta
          href={matchRequestHref(matchRef)}
          intent="buy"
          location="match_page_unavailable"
        >
          <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
          {t("barWhatsapp")}
        </WhatsAppCta>
        <CallLink location="match_page_unavailable">{t("barCall")}</CallLink>
      </Notice>
    );
  }

  const { matches, closest, summary } = result;
  const egp = translate("lenaqar.unit.egp");
  const amount = (value) => `${formatEgpNumber(value)} ${egp}`;
  const placeName = (place) => {
    if (place.project) return place.project;
    const token = place.sub_district || place.district || place.city;
    return localizedPlaceName(token, place.labelAr || placeAr(token), locale);
  };

  const badge = (unit) =>
    unit.match?.kind === "closest" ? (
      <p className="self-start rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
        {t(`miss.${unit.match.labelKey}`).replace(
          "{amount}",
          unit.match.amount != null ? amount(unit.match.amount) : "",
        )}
      </p>
    ) : (
      <p className="self-start rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
        {t("matchBadge")}
      </p>
    );

  // A tap on WhatsApp or Call tells the team which unit this buyer asked about.
  // Not awaited: the link opens at once whatever the answer.
  const noteInterest = (unit, event) => {
    const intent = event.target.closest?.("a[data-cta-intent]")?.dataset.ctaIntent;
    if (!intent) return;
    recordUnitInterest({
      matchRef,
      unitCode: unit.code,
      channel: intent === "call" ? "call" : "whatsapp",
    }).catch(() => {});
  };

  const actions = (unit) => (
    <div
      className="mt-auto grid grid-cols-2 gap-2"
      onClickCapture={(event) => noteInterest(unit, event)}
    >
      <WhatsAppCta
        href={matchUnitHref(unit, matchRef)}
        intent="buy"
        location="match_page_card"
        unitCode={unit.code}
        className="w-full"
      >
        <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
        {t("unitWhatsapp")}
      </WhatsAppCta>
      <CallLink location="match_page_card" unitCode={unit.code} className="w-full">
        {t("unitCall")}
      </CallLink>
    </div>
  );

  const grid = (units) => (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {units.map((unit) => (
        <li key={unit.code} className="flex">
          <div className="flex w-full flex-col [&>article]:grow">
            <OpportunityCard unit={unit} badge={badge(unit)} actions={actions(unit)} />
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="container py-6 sm:py-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="lq-display flex flex-wrap items-center gap-2 text-2xl font-bold text-primary sm:text-3xl">
            {t("title")}
            <span
              aria-label={`${t("countLabel")}: ${matches.length}`}
              className="inline-flex min-w-8 items-center justify-center rounded-full bg-primary px-2.5 py-0.5 text-base font-bold tabular-nums text-white"
            >
              {matches.length}
            </span>
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-black/70">{t("yourRequest")}:</span>
            {summary.places.map((place) => (
              <span key={placeKey(place)} className={summaryChipClass}>
                {placeName(place)}
              </span>
            ))}
            {summary.propertyTypes.map((type) => (
              <span key={type} className={summaryChipClass}>
                {translate(`buildingTypes.${type}`, type)}
              </span>
            ))}
            {summary.maxPrice ? (
              <span className={summaryChipClass}>
                {t("budgetUpTo").replace("{amount}", amount(summary.maxPrice))}
              </span>
            ) : null}
            {summary.rooms ? (
              <span className={summaryChipClass}>{roomsLabelAr(summary.rooms)}</span>
            ) : null}
            <BuyRequestCta
              label={ownsRequest ? t("edit") : t("newRequest")}
              variant="secondary"
              size="compact"
              trackingLocation="match_page_edit"
            />
          </div>
        </div>

        {/* Desktop: the two ways to reach us. Phones get the bar at the bottom. */}
        <div className="hidden shrink-0 gap-2 lg:flex">
          <WhatsAppCta href={matchRequestHref(matchRef)} intent="buy" location="match_page_header">
            <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
            {t("barWhatsapp")}
          </WhatsAppCta>
          <CallLink location="match_page_header">{t("barCall")}</CallLink>
        </div>
      </header>

      <section aria-label={t("title")} className="mt-6">
        {matches.length ? (
          grid(matches)
        ) : (
          <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-6 text-center">
            <p className="text-lg font-bold text-primary">{t("emptyTitle")}</p>
            <p className="mt-1 text-sm leading-relaxed text-black/70">{t("emptyBody")}</p>
          </div>
        )}
      </section>

      {closest.length ? (
        <section aria-labelledby="match-closest-title" className="mt-10">
          <h2 id="match-closest-title" className="lq-display text-xl font-bold text-primary">
            {t("closestTitle")}
          </h2>
          <p className="mt-1 text-sm text-black/70">{t("closestHint")}</p>
          <div className="mt-4">{grid(closest)}</div>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-2 border-t border-black/10 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <WhatsAppCta
          href={matchRequestHref(matchRef)}
          intent="buy"
          location="match_page_bar"
          className="w-full"
        >
          <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
          {t("barWhatsapp")}
        </WhatsAppCta>
        <CallLink location="match_page_bar" className="w-full">
          {t("barCall")}
        </CallLink>
      </div>
    </div>
  );
}
