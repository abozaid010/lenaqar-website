"use client";

import { FadeIn, FadeInItem, FadeInStagger } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import Image from "next/image";

const OFFERS = [
  {
    image: "/images/solutions/campaigns.svg",
    titleKey: "solutions.agencies.simple.partnerOffers.card1.title",
    descriptionKey: "solutions.agencies.simple.partnerOffers.card1.description",
  },
  {
    image: "/images/solutions/crm-dashboard.svg",
    titleKey: "solutions.agencies.simple.partnerOffers.card2.title",
    descriptionKey: "solutions.agencies.simple.partnerOffers.card2.description",
  },
];

export default function AgenciesPartnerOffers() {
  const { translate } = useI18n();

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container">
        <FadeIn className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            {translate("solutions.agencies.simple.partnerOffers.title")}
          </h2>
        </FadeIn>
        <FadeInStagger className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {OFFERS.map((offer) => (
            <FadeInItem key={offer.titleKey}>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="relative aspect-[16/10] bg-gradient-to-br from-primary/5 to-slate-100">
                  <Image
                    src={offer.image}
                    alt={translate(offer.titleKey)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 480px"
                  />
                </div>
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-primary">
                    {translate(offer.titleKey)}
                  </h3>
                  <p className="mt-3 text-slate-600 leading-relaxed">
                    {translate(offer.descriptionKey)}
                  </p>
                </div>
              </article>
            </FadeInItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
