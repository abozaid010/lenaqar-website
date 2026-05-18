"use client";

import FeatureCard from "@/components/web/solutions/ui/FeatureCard";
import { FadeIn, FadeInItem, FadeInStagger } from "@/components/web/solutions/ui/FadeIn";
import { getSolutionIcon } from "@/content/solutions/iconMap";
import { useI18n } from "@/hooks/useI18n";

export default function SolutionFeatureGrid({ config }) {
  const { translate } = useI18n();
  const { solutions } = config;

  return (
    <section className="py-20 md:py-24 bg-white">
      <div className="container">
        <FadeIn className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">
            {translate(solutions.sectionTitleKey)}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {translate(solutions.sectionSubtitleKey)}
          </p>
        </FadeIn>
        <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {solutions.items.map((item) => (
            <FadeInItem key={item.titleKey}>
              <FeatureCard
                icon={getSolutionIcon(item.iconKey)}
                title={translate(item.titleKey)}
                description={
                  item.descriptionKey
                    ? translate(item.descriptionKey)
                    : undefined
                }
              />
            </FadeInItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
