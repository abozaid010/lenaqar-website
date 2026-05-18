"use client";

import GlassCard from "@/components/web/solutions/ui/GlassCard";
import { FadeIn, FadeInItem, FadeInStagger } from "@/components/web/solutions/ui/FadeIn";
import { getSolutionIcon } from "@/content/solutions/iconMap";
import { useI18n } from "@/hooks/useI18n";

export default function ProblemGrid({ config }) {
  const { translate } = useI18n();
  const { problems } = config;

  return (
    <section className="py-20 md:py-24 bg-slate-50">
      <div className="container">
        <FadeIn className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">
            {translate(problems.sectionTitleKey)}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {translate(problems.sectionSubtitleKey)}
          </p>
        </FadeIn>
        <FadeInStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {problems.items.map((item) => {
            const Icon = getSolutionIcon(item.iconKey);
            return (
              <FadeInItem key={item.titleKey}>
                <GlassCard className="p-5 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="font-medium text-slate-800 pt-1.5">
                    {translate(item.titleKey)}
                  </p>
                </GlassCard>
              </FadeInItem>
            );
          })}
        </FadeInStagger>
      </div>
    </section>
  );
}
