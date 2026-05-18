"use client";

import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";

export default function AgenciesWhoWeAre() {
  const { translate } = useI18n();

  return (
    <section className="pt-28 pb-16 md:pt-32 md:pb-20 bg-primary text-white">
      <div className="container max-w-3xl">
        <FadeIn>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-200 mb-4">
            {translate("solutions.agencies.simple.whoWeAre.label")}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            {translate("solutions.agencies.simple.whoWeAre.title")}
          </h1>
          <p className="mt-6 text-lg text-blue-100/90 leading-relaxed">
            {translate("solutions.agencies.simple.whoWeAre.description")}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
