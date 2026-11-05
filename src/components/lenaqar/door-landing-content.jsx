"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import BuyRequestCta from "./buy-request-cta";
import { DOORS } from "@/lib/lenaqar/doors";
import { actionButtonClass } from "@/components/ui/action-button-class";
import ActionButtonArrow from "@/components/ui/action-button-arrow";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";
import { sellerCtaHref } from "@/lib/lenaqar/whatsapp";

function relatedLabel(href) {
  const door = DOORS.find((d) => d.href === href);
  if (door) return door.h1.split(":")[0].slice(0, 48);
  if (href === "/how-it-works") return "إزاي بنشتغل";
  if (href === "/sell") return "بيع وحدتك";
  if (href === "/opportunities") return "الفرص العقارية";
  if (href === "/calculator") return "حاسبة الإلغاء والبيع";
  if (href.startsWith("/guides/")) return href.replace(/\/guides\//, "").replace(/\//g, " · ");
  return href;
}

export default function DoorLandingContent({ door }) {
  const { translate } = useI18n();

  return (
    <div className="container py-10 sm:py-14 pb-24 lg:pb-14 space-y-12">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary leading-snug">
          {door.h1}
        </h1>
        <p className="text-base sm:text-lg text-black/75 leading-relaxed">
          {door.intro}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {door.primaryCta === "calculator" ? (
            <Link
              href="/calculator"
              data-track="calculator_link"
              data-cta-location="door_hero"
              className={actionButtonClass({ variant: "primary" })}
            >
              {translate("lenaqar.doors.ctaCalculator")}
              <ActionButtonArrow />
            </Link>
          ) : (
            <BuyRequestCta
              trackingLocation="door_hero"
              variant="primary"
              label={translate("lenaqar.doors.ctaBuy")}
              className="!px-6 !py-3.5 !text-base font-bold"
            />
          )}
          <a
            href={sellerCtaHref()}
            target="_blank"
            rel="noopener noreferrer"
            className={actionButtonClass({ variant: "secondary" })}
            dir="ltr"
            data-cta-intent="sell"
            data-cta-location="door_hero"
          >
            واتساب {LENAQAR_CONTACT.whatsappDisplay}
            <ActionButtonArrow />
          </a>
          <Link href="/how-it-works" className={actionButtonClass({ variant: "secondary" })}>
            {translate("lenaqar.doors.ctaHow")}
            <ActionButtonArrow />
          </Link>
        </div>
      </header>

      <section className="max-w-3xl">
        <ul className="space-y-3">
          {(door.bullets || []).map((item) => (
            <li
              key={item}
              className="rounded-xl border border-primary/10 bg-white px-4 py-3 text-sm leading-relaxed text-black/80"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      {(door.sections || []).map((section) => (
        <section key={section.heading} className="max-w-3xl space-y-3">
          <h2 className="text-2xl font-bold text-primary">{section.heading}</h2>
          <p className="text-base leading-relaxed text-black/75">{section.body}</p>
        </section>
      ))}

      {door.howTo?.steps?.length ? (
        <section className="max-w-3xl space-y-4">
          <h2 className="text-2xl font-bold text-primary">{door.howTo.name}</h2>
          {door.howTo.description ? (
            <p className="text-base leading-relaxed text-black/75">
              {door.howTo.description}
            </p>
          ) : null}
          <ol className="space-y-3">
            {door.howTo.steps.map((step, index) => (
              <li
                key={step.name}
                className="rounded-xl border border-primary/10 bg-white p-5"
              >
                <p className="text-xs font-semibold tabular-nums text-primary/50">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-bold text-primary">{step.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-black/70">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {(door.faq || []).length > 0 ? (
        <section className="max-w-3xl space-y-4">
          <h2 className="text-2xl font-bold text-primary">
            {translate("lenaqar.doors.faqTitle")}
          </h2>
          <dl className="space-y-4">
            {door.faq.map((item) => (
              <div
                key={item.q}
                className="rounded-lg border border-black/10 bg-white p-5"
              >
                <dt className="font-semibold mb-2">{item.q}</dt>
                <dd className="text-sm text-black/70 leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {(door.related || []).length > 0 ? (
        <section className="max-w-3xl space-y-4">
          <h2 className="text-2xl font-bold text-primary">
            {translate("lenaqar.doors.relatedTitle")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {door.related.map((href) => (
              <Link
                key={href}
                href={href}
                className="min-h-11 rounded-lg border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                {relatedLabel(href)}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="max-w-3xl rounded-3xl bg-primary px-6 py-8 text-white sm:px-8">
        <h2 className="text-xl font-bold sm:text-2xl">
          {translate("lenaqar.doors.closingTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/85">
          {translate("lenaqar.doors.closingSub")}
        </p>
        <div className="mt-5">
          <BuyRequestCta
            trackingLocation="door_closing"
            variant="primary"
            tone="onPrimary"
            label={translate("lenaqar.doors.ctaBuy")}
            className="!bg-white !text-primary hover:!bg-white/90"
          />
        </div>
      </section>
    </div>
  );
}
