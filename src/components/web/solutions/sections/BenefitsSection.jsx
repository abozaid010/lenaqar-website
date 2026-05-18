"use client";

import { FadeIn, FadeInItem, FadeInStagger } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import { CheckCircle2 } from "lucide-react";

export default function BenefitsSection({ config }) {
  const { translate } = useI18n();
  const { benefits } = config;

  return (
    <section className="py-20 md:py-24 bg-gradient-to-br from-primary to-[#1a1878] text-white">
      <div className="container">
        <FadeIn className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold">
            {translate(benefits.sectionTitleKey)}
          </h2>
        </FadeIn>
        <FadeInStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-14">
          {benefits.items.map((item) => (
            <FadeInItem
              key={item.titleKey}
              className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 px-5 py-4"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#21EAF4]" aria-hidden />
              <span className="font-medium">{translate(item.titleKey)}</span>
            </FadeInItem>
          ))}
        </FadeInStagger>
        <FadeIn className="text-center">
          <p className="text-xl md:text-2xl font-semibold text-blue-100 max-w-3xl mx-auto leading-relaxed">
            {translate(benefits.closingKey)}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
