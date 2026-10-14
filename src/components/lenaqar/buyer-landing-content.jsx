"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import BuyRequestCta from "./buy-request-cta";
import RequirementCard from "./requirement-card";
import { BUYER_LANDINGS } from "@/lib/lenaqar/buyer-landings";
import { actionButtonClass } from "@/components/ui/action-button-class";
import ActionButtonArrow from "@/components/ui/action-button-arrow";

export default function BuyerLandingContent({ landing, matchedRequirements = [] }) {
  const { translate } = useI18n();

  const related = (landing.related || [])
    .map((href) => BUYER_LANDINGS.find((page) => page.href === href))
    .filter(Boolean);

  return (
    <div className="container py-10 sm:py-14 pb-24 lg:pb-14 space-y-12">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary leading-snug">
          {landing.h1}
        </h1>
        <p className="text-base sm:text-lg text-black/75 leading-relaxed">
          {landing.intro}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <BuyRequestCta
            variant="primary"
            label={translate("lenaqar.landings.cta")}
            initialValues={landing.initialValues}
            className="!px-6 !py-3.5 !text-base font-bold"
          />
          <Link href="/opportunities" className={actionButtonClass({ variant: "secondary" })}>
            {translate("lenaqar.landings.opportunitiesLink")}
            <ActionButtonArrow />
          </Link>
          <Link href="/how-it-works" className={actionButtonClass({ variant: "secondary" })}>
            {translate("lenaqar.landings.howLink")}
            <ActionButtonArrow />
          </Link>
        </div>
        <p className="text-sm text-black/60">{translate("lenaqar.landings.privacy")}</p>
      </header>

      <section className="max-w-3xl">
        <ul className="space-y-3">
          {(landing.bullets || []).map((item) => (
            <li
              key={item}
              className="rounded-xl border border-primary/10 bg-white px-4 py-3 text-sm leading-relaxed text-black/80"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section id="similar-requests" className="space-y-4">
        <h2 className="text-2xl font-bold text-primary">
          {translate("lenaqar.landings.seeRequests")}
        </h2>
        {matchedRequirements.length === 0 ? (
          <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-6">
            <p className="font-semibold text-primary">
              {translate("lenaqar.landings.emptyTitle")}
            </p>
            <p className="mt-2 text-sm text-black/70">
              {translate("lenaqar.landings.emptyBody")}
            </p>
            <div className="mt-4">
              <BuyRequestCta
                variant="primary"
                initialValues={landing.initialValues}
                label={translate("lenaqar.landings.cta")}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {matchedRequirements.map((requirement) => (
              <RequirementCard key={requirement.id} requirement={requirement} />
            ))}
          </div>
        )}
      </section>

      {(landing.faq || []).length > 0 ? (
        <section className="max-w-3xl space-y-4">
          <h2 className="text-2xl font-bold text-primary">
            {translate("lenaqar.landings.faqTitle")}
          </h2>
          <dl className="space-y-4">
            {landing.faq.map((item) => (
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

      {related.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-primary">
            {translate("lenaqar.landings.relatedTitle")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {related.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="min-h-11 rounded-lg border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
              >
                {translate(page.labelKey)}
              </Link>
            ))}
            <Link
              href="/guides"
              className="min-h-11 rounded-lg border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              {translate("lenaqar.guides.indexTitle")}
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
