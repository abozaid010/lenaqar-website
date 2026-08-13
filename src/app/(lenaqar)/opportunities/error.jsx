"use client";

import { useI18n } from "@/hooks/useI18n";

export default function OpportunitiesError({ reset }) {
  const { translate } = useI18n();

  return (
    <section className="container py-12 pb-24 lg:pb-12">
      <h1 className="text-2xl font-bold text-primary mb-3">
        {translate("lenaqar.opportunities.errorTitle")}
      </h1>
      <p className="text-black/70 mb-6">
        {translate("lenaqar.opportunities.error")}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center justify-center rounded-md bg-primary text-white font-medium px-4 py-3 text-sm"
      >
        {translate("lenaqar.opportunities.retry")}
      </button>
    </section>
  );
}
