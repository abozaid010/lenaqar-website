"use client";

import { useI18n } from "@/hooks/useI18n";
import { formatDate } from "@/lib/units/unit-formatters";

export default function NetworkStrip({ updatedAt }) {
  const { translate } = useI18n();
  const dateLabel = formatDate(updatedAt || new Date(), "ar") || "";

  return (
    <section className="bg-primary text-white">
      <div className="container py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm">
        <p className="font-semibold">{translate("lenaqar.network.developer")}</p>
        <p>{translate("lenaqar.network.projects")}</p>
        <p>
          {translate("lenaqar.network.pricesUpdated").replace("{date}", dateLabel)}
        </p>
      </div>
    </section>
  );
}
