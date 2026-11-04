"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import BuyRequestCta from "./buy-request-cta";
import FaqSection from "./faq-section";
import NetworkBrokerCta from "./network-broker-cta";
import { DOORS } from "@/lib/lenaqar/doors";
import { actionButtonClass } from "@/components/ui/action-button-class";
import ActionButtonArrow from "@/components/ui/action-button-arrow";
import { ANALYTICS } from "@/constants/analytics";
import { marketplaceAddUnitHref } from "@/lib/lenaqar/whatsapp";
import WhatsAppCta from "./whatsapp-cta";

function FlowBlock({
  titleKey,
  steps,
  noteKey,
  imageSrc,
  imageAltKey,
  cta,
}) {
  const { translate } = useI18n();

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">{translate(titleKey)}</h2>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li
              key={step.titleKey}
              className="flex items-start gap-4"
            >
              {/* Step Number Circle */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                {step.num}
              </div>

              {/* Step Content */}
              <div className="flex-1 pt-1">
                <h3 className="font-bold text-base text-primary">
                  {translate(step.titleKey)}
                </h3>
                <p className="mt-1 text-sm text-black/70 leading-relaxed">
                  {translate(step.bodyKey)}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block flex-shrink-0 w-0.5 min-h-12 bg-primary/20 -mt-2" />
              )}
            </li>
          ))}
        </ol>
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-[#f7f6f2]">
          <Image
            src={imageSrc}
            alt={translate(imageAltKey)}
            width={960}
            height={1200}
            className="h-auto w-full"
            sizes="(max-width: 1024px) 100vw, 480px"
          />
        </div>
      </div>
      {noteKey ? (
        <p className="max-w-2xl text-sm leading-relaxed text-black/70">
          {translate(noteKey)}
        </p>
      ) : null}
      {cta}
    </section>
  );
}

export default function HowItWorksContent() {
  const { translate } = useI18n();

  const buySteps = [1, 2, 3, 4].map((num) => ({
    num,
    titleKey: `lenaqar.howItWorks.buyStep${num}Title`,
    bodyKey: `lenaqar.howItWorks.buyStep${num}Body`,
  }));

  const sellSteps = [1, 2, 3, 4].map((num) => ({
    num,
    titleKey: `lenaqar.howItWorks.sellerStep${num}Title`,
    bodyKey: `lenaqar.howItWorks.sellerStep${num}Body`,
  }));

  return (
    <div className="container space-y-14 py-10 pb-24 sm:py-14 lg:pb-14">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold text-primary sm:text-4xl">
          {translate("lenaqar.howItWorks.pageTitle")}
        </h1>
        <p className="text-base leading-relaxed text-black/70 sm:text-lg">
          {translate("lenaqar.howItWorks.pageIntro")}
        </p>
        <BuyRequestCta variant="primary" />
      </header>

      <FlowBlock
        titleKey="lenaqar.howItWorks.buySectionTitle"
        steps={buySteps}
        noteKey="lenaqar.howItWorks.requestWaitingNote"
        imageSrc="/images/clients/lenaqar-flow-buyer.png"
        imageAltKey="lenaqar.howItWorks.buyFlowAlt"
        cta={
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <BuyRequestCta variant="primary" />
            <Link
              href="/opportunities"
              className={actionButtonClass({ variant: "secondary" })}
            >
              {translate("lenaqar.howItWorks.buyCta")}
              <ActionButtonArrow />
            </Link>
          </div>
        }
      />

      <FlowBlock
        titleKey="lenaqar.howItWorks.sellerSectionTitle"
        steps={sellSteps}
        imageSrc="/images/clients/lenaqar-flow-seller-broker.png"
        imageAltKey="lenaqar.howItWorks.sellerFlowAlt"
        cta={
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/sell" className={actionButtonClass({ variant: "primary" })}>
              {translate("lenaqar.howItWorks.sellCta")}
              <ActionButtonArrow />
            </Link>
            <WhatsAppCta
              href={marketplaceAddUnitHref()}
              eventName={ANALYTICS.EVENTS.MARKETPLACE_WHATSAPP_CLICKED}
              className="!bg-[#25D366] hover:!bg-[#20BA5A]"
            >
              {translate("lenaqar.marketplace.closing.sellerCta")}
            </WhatsAppCta>
          </div>
        }
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-primary">
          {translate("lenaqar.doors.sectionTitle")}
        </h2>
        <div className="flex flex-wrap gap-3">
          {DOORS.map((door) => (
            <Link
              key={door.href}
              href={door.href}
              className="min-h-11 rounded-lg border border-primary/20 bg-white px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              {translate(`lenaqar.doors.${door.slug.replace(/-/g, "_")}.cardTitle`)}
            </Link>
          ))}
        </div>
      </section>

      <NetworkBrokerCta />
      <FaqSection />
    </div>
  );
}
