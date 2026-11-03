"use client";

import { useI18n } from "@/hooks/useI18n";
import { formatDate } from "@/lib/units/unit-formatters";

export default function NetworkStrip({ updatedAt }) {
  const { translate } = useI18n();
  const dateLabel = updatedAt ? formatDate(updatedAt, "ar") : "";

  return (
    <section className="bg-primary text-white">
      <div className="container py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm">
        <p className="font-semibold">{translate("lenaqar.network.developer")}</p>
        <p>{translate("lenaqar.network.projects")}</p>
        {dateLabel ? (
          <p>
            {translate("lenaqar.network.recordUpdated").replace("{date}", dateLabel)}
          </p>
        ) : null}
      </div>
    </section>
  );
}
