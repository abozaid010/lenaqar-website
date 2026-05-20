"use client";

import CalendarModal from "@/components/ui/calendar-modal";
import { useI18n } from "@/hooks/useI18n";

export default function SeoDemoCta({
  titleKey,
  buttonKey = "seo.landing.ctaButton",
  subtextKey,
  className = "",
}) {
  const { translate } = useI18n();

  return (
    <section
      className={`rounded-2xl border border-primary/15 bg-primary/5 px-6 py-10 text-center md:px-10 ${className}`}
      aria-label={translate(titleKey)}
    >
      <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
        {translate(titleKey)}
      </h2>
      {subtextKey ? (
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
          {translate(subtextKey)}
        </p>
      ) : null}
      <div className="mt-6 flex justify-center">
        <CalendarModal
          buttonText={translate(buttonKey)}
          style="rounded-xl bg-primary px-8 py-3 text-sm font-medium text-white shadow-lg hover:opacity-95"
        />
      </div>
    </section>
  );
}
