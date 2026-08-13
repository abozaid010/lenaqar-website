"use client";

import { Suspense } from "react";
import { useI18n } from "@/hooks/useI18n";
import OpportunityCard from "@/components/lenaqar/opportunity-card";
import OpportunityFilters from "@/components/lenaqar/opportunity-filters";

export default function OpportunitiesPageContent({ units, areas, years }) {
  const { translate } = useI18n();

  return (
    <section className="container py-12 pb-24 lg:pb-12">
      <h1 className="text-3xl font-bold text-primary leading-snug">
        {translate("lenaqar.opportunities.title")}
      </h1>
      <p className="mt-4 mb-2 text-black/70 max-w-2xl">
        {translate("lenaqar.opportunities.sub")}
      </p>
      <p className="text-sm text-black/60 mb-8">
        {translate("lenaqar.opportunities.honesty")}
      </p>

      <Suspense>
        <OpportunityFilters areas={areas} years={years} />
      </Suspense>

      {units.length === 0 ? (
        <p className="text-black/70">{translate("lenaqar.opportunities.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <OpportunityCard key={unit.code} unit={unit} />
          ))}
        </div>
      )}
    </section>
  );
}
