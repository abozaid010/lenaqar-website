"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import HowItWorksSteps from "./how-it-works-steps";
import BuyRequestCta from "./buy-request-cta";

function FlowSteps({ titleKey, steps, cta }) {
  const { translate } = useI18n();

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">{translate(titleKey)}</h2>
      <ol className="space-y-4">
        {steps.map((step) => (
          <li
            key={step.titleKey}
            className="rounded-lg border border-black/10 p-5 bg-white"
          >
            <p className="text-xs text-black/50 mb-2 tabular-nums">{step.num}</p>
            <h3 className="font-semibold mb-2">{translate(step.titleKey)}</h3>
            <p className="text-sm text-black/70">{translate(step.bodyKey)}</p>
          </li>
        ))}
      </ol>
      {cta}
    </section>
  );
}

export default function HowItWorksContent() {
  const { translate } = useI18n();

  const buySteps = [
    {
      num: 1,
      titleKey: "lenaqar.howItWorks.buyStep1Title",
      bodyKey: "lenaqar.howItWorks.buyStep1Body",
    },
    {
      num: 2,
      titleKey: "lenaqar.howItWorks.buyStep2Title",
      bodyKey: "lenaqar.howItWorks.buyStep2Body",
    },
    {
      num: 3,
      titleKey: "lenaqar.howItWorks.buyStep3Title",
      bodyKey: "lenaqar.howItWorks.buyStep3Body",
    },
  ];

  const requestSteps = [
    {
      num: 1,
      titleKey: "lenaqar.howItWorks.requestStep1Title",
      bodyKey: "lenaqar.howItWorks.requestStep1Body",
    },
    {
      num: 2,
      titleKey: "lenaqar.howItWorks.requestStep2Title",
      bodyKey: "lenaqar.howItWorks.requestStep2Body",
    },
    {
      num: 3,
      titleKey: "lenaqar.howItWorks.requestStep3Title",
      bodyKey: "lenaqar.howItWorks.requestStep3Body",
    },
  ];

  return (
    <div className="container py-10 sm:py-14 space-y-14 pb-24 lg:pb-14">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">
          {translate("lenaqar.howItWorks.pageTitle")}
        </h1>
        <p className="text-base sm:text-lg text-black/70 leading-relaxed">
          {translate("lenaqar.howItWorks.pageIntro")}
        </p>
      </header>

      <HowItWorksSteps variant="full" showSellLink={false} />

      <FlowSteps
        titleKey="lenaqar.howItWorks.buySectionTitle"
        steps={buySteps}
        cta={
          <Link
            href="/opportunities"
            className="inline-flex items-center justify-center rounded-md bg-primary text-white font-medium px-4 py-3 text-sm min-h-11"
          >
            {translate("lenaqar.howItWorks.buyCta")}
          </Link>
        }
      />

      <FlowSteps
        titleKey="lenaqar.howItWorks.requestSectionTitle"
        steps={requestSteps}
        cta={
          <BuyRequestCta variant="primary" />
        }
      />
    </div>
  );
}
