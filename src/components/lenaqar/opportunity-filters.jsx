"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { ANALYTICS } from "@/constants/analytics";
import UnitLocationSearch from "@/components/ui/unit-forms/unit-location-search";

function emptyLocation() {
  return {
    city: "",
    district: "",
    sub_district: "",
    project: "",
    project_ar: "",
    project_id: "",
  };
}

function locationFromSearchParams(searchParams) {
  return {
    city: searchParams.get("city") || "",
    district: searchParams.get("district") || "",
    sub_district: searchParams.get("sub_district") || "",
    project:
      searchParams.get("project") || searchParams.get("project_name") || "",
    project_ar: "",
    project_id: "",
  };
}

export default function OpportunityFilters({ years = [] }) {
  const { translate } = useI18n();
  const { trackEvent } = useGoogleAnalytics();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const cash = searchParams.get("cash") || "";
  const delivery = searchParams.get("delivery") || "";
  const [location, setLocation] = useState(() =>
    locationFromSearchParams(searchParams),
  );

  useEffect(() => {
    setLocation(locationFromSearchParams(searchParams));
  }, [searchParams]);

  function apply(next) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("area");
    params.delete("project_name");

    if (next.city) params.set("city", next.city);
    else params.delete("city");
    if (next.district) params.set("district", next.district);
    else params.delete("district");
    if (next.sub_district) params.set("sub_district", next.sub_district);
    else params.delete("sub_district");
    if (next.project) params.set("project", next.project);
    else params.delete("project");
    if (next.cash) params.set("cash", next.cash);
    else params.delete("cash");
    if (next.delivery) params.set("delivery", next.delivery);
    else params.delete("delivery");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <form
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const nextCash = String(form.get("cash") || "").trim();
        if (nextCash) {
          trackEvent(ANALYTICS.EVENTS.CASH_ENTERED, { cash: nextCash });
        }
        apply({
          city: location.city,
          district: location.district,
          sub_district: location.sub_district,
          project: location.project,
          cash: nextCash,
          delivery: String(form.get("delivery") || "").trim(),
        });
      }}
    >
      <UnitLocationSearch
        formData={location}
        isPublic
        showAllOption
        showHint={false}
        showHierarchySummary={false}
        className="sm:col-span-2"
        label={translate("lenaqar.opportunities.filterArea")}
        allOptionLabel={translate("lenaqar.opportunities.allAreas")}
        placeholder={translate(
          "basicDetails.locationSearchPlaceholder",
          "Search project, area, district, or city…",
        )}
        onSelectLocation={(payload) =>
          setLocation({
            ...emptyLocation(),
            city: payload?.city ?? "",
            district: payload?.district ?? "",
            sub_district: payload?.sub_district ?? "",
            project: payload?.project ?? "",
            project_ar: payload?.project_ar ?? "",
            project_id: payload?.project_id ?? "",
          })
        }
        onSelectProject={(proj) =>
          setLocation({
            city: proj?.city ?? "",
            district: proj?.district ?? "",
            sub_district: proj?.sub_district ?? "",
            project: proj?.en_name || proj?.name || "",
            project_ar: proj?.ar_name ?? "",
            project_id: proj?.id ? String(proj.id) : "",
          })
        }
      />

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
        className="sm:col-span-2 rounded-md bg-primary text-white font-medium py-2 px-4 text-sm"
      >
        {translate("lenaqar.opportunities.apply")}
      </button>
    </form>
  );
}
