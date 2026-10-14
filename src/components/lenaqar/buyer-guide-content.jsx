"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import BuyRequestCta from "./buy-request-cta";
import { BUYER_GUIDES } from "@/lib/lenaqar/buyer-guides";
import { actionButtonClass } from "@/components/ui/action-button-class";
import ActionButtonArrow from "@/components/ui/action-button-arrow";

export default function BuyerGuideContent({ guide }) {
  const { translate } = useI18n();
  const others = BUYER_GUIDES.filter((item) => item.slug !== guide.slug);

  return (
    <article className="container py-10 sm:py-14 pb-24 lg:pb-14 max-w-3xl">
      <header className="space-y-4 mb-10">
        <p className="text-sm font-semibold text-primary">
          <Link href="/guides" className="hover:underline">
            {translate("lenaqar.guides.indexTitle")}
          </Link>
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-primary leading-snug">
          {guide.h1}
        </h1>
        <p className="text-base sm:text-lg text-black/75 leading-relaxed">
          {guide.intro}
        </p>
      </header>

      <div className="space-y-8">
        {(guide.sections || []).map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-bold text-primary mb-2">{section.title}</h2>
            <p className="text-base text-black/75 leading-relaxed">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-10 text-base text-black/75 leading-relaxed">{guide.closing}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <BuyRequestCta
          variant="primary"
          label={translate("lenaqar.guides.requestCta")}
        />
        <Link href="/how-it-works" className={actionButtonClass({ variant: "secondary" })}>
          {translate("lenaqar.header.howItWorks")}
          <ActionButtonArrow />
        </Link>
      </div>

      {others.length > 0 ? (
        <nav className="mt-12 pt-8 border-t border-primary/10 space-y-3" aria-label="أدلة أخرى">
          {others.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-primary font-semibold hover:underline"
            >
              {item.h1}
            </Link>
          ))}
        </nav>
      ) : null}
    </article>
  );
}
