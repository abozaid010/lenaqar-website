"use client";

import { LANDING_OFFERS, lk } from "@/content/solutions/landingConfig";
import { FadeIn, FadeInItem, FadeInStagger } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import Image from "next/image";

export default function LandingOffersSection({ audience }) {
  const { translate } = useI18n();
  const offers = LANDING_OFFERS[audience];

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container">
        <FadeIn className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            {translate(lk(audience, "offers.title"))}
          </h2>
        </FadeIn>
        <FadeInStagger className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {offers.map((offer) => (
            <FadeInItem key={offer.titleKey}>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="relative aspect-[16/10] bg-gradient-to-br from-primary/5 to-slate-100">
                  <Image
                    src={offer.image}
                    alt={translate(lk(audience, offer.titleKey))}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 480px"
                  />
                </div>
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-primary">
                    {translate(lk(audience, offer.titleKey))}
                  </h3>
                  <p className="mt-3 text-slate-600 leading-relaxed">
                    {translate(lk(audience, offer.descriptionKey))}
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
