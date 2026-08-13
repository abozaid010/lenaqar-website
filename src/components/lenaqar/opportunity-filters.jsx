"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { ANALYTICS } from "@/constants/analytics";

export default function OpportunityFilters({ areas, years }) {
  const { translate } = useI18n();
  const { trackEvent } = useGoogleAnalytics();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const area = searchParams.get("area") || "";
  const cash = searchParams.get("cash") || "";
  const delivery = searchParams.get("delivery") || "";

  function apply(next) {
    const params = new URLSearchParams();
    if (next.area) params.set("area", next.area);
    if (next.cash) params.set("cash", next.cash);
    if (next.delivery) params.set("delivery", next.delivery);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <form
      className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const nextCash = String(form.get("cash") || "").trim();
        if (nextCash) {
          trackEvent(ANALYTICS.EVENTS.CASH_ENTERED, { cash: nextCash });
        }
        apply({
          area: String(form.get("area") || "").trim(),
          cash: nextCash,
          delivery: String(form.get("delivery") || "").trim(),
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span>{translate("lenaqar.opportunities.filterArea")}</span>
        <select
          name="area"
          defaultValue={area}
          className="border border-black/15 rounded-md px-3 py-2 bg-white"
        >
          <option value="">{translate("lenaqar.opportunities.allAreas")}</option>
          {areas.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>{translate("lenaqar.opportunities.filterCash")}</span>
        <input
          name="cash"
          type="number"
          min="1"
          inputMode="numeric"
          defaultValue={cash}
          placeholder={translate("lenaqar.opportunities.cashPlaceholder")}
          className="border border-black/15 rounded-md px-3 py-2 tabular-nums"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>{translate("lenaqar.opportunities.filterDelivery")}</span>
        <select
          name="delivery"
          defaultValue={delivery}
          className="border border-black/15 rounded-md px-3 py-2 bg-white"
        >
          <option value="">{translate("lenaqar.opportunities.allYears")}</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="sm:col-span-3 rounded-md bg-primary text-white font-medium py-2 px-4 text-sm"
      >
        {translate("lenaqar.opportunities.apply")}
      </button>
    </form>
  );
}
