"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { ANALYTICS } from "@/constants/analytics";
import { cashBucket } from "@/lib/analytics-utils";
import { X } from "lucide-react";
import UnitLocationSearch from "@/components/ui/unit-forms/unit-location-search";
import { formatPrice, parseMoneyInput } from "@/utils/parse-amount";
import {
  REQUEST_FILTER_KEYS,
  queryWithoutFilters,
  readRequestFilters,
} from "@/lib/lenaqar/opportunity-request-filters";

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

/** URL / form cash → "" or positive integer (Arabic digits normalized). */
function cashFromParam(value) {
  const parsed = parseMoneyInput(value);
  return parsed === "" ? "" : parsed;
}

export default function OpportunityFilters({ years = [] }) {
  const { translate } = useI18n();
  const { trackEvent } = useGoogleAnalytics();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const delivery = searchParams.get("delivery") || "";
  const [cash, setCash] = useState(() =>
    cashFromParam(searchParams.get("cash")),
  );
  const [location, setLocation] = useState(() =>
    locationFromSearchParams(searchParams),
  );

  useEffect(() => {
    setLocation(locationFromSearchParams(searchParams));
    setCash(cashFromParam(searchParams.get("cash")));
  }, [searchParams]);

  function apply(next) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("area");
    params.delete("project_name");
    // A new filter means a new result set — keeping the old page number would
    // land the visitor past the end of it.
    params.delete("page");

    if (next.city) params.set("city", next.city);
    else params.delete("city");
    if (next.district) params.set("district", next.district);
    else params.delete("district");
    if (next.sub_district) params.set("sub_district", next.sub_district);
    else params.delete("sub_district");
    if (next.project) params.set("project", next.project);
    else params.delete("project");
    if (next.cash) params.set("cash", String(next.cash));
    else params.delete("cash");
    if (next.delivery) params.set("delivery", next.delivery);
    else params.delete("delivery");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  // Type, rooms and price range arrive in the URL (from a buy request or a shared
  // link) and Apply keeps them. They have no field here, so each is shown as a chip
  // the visitor can remove — otherwise "no units" has no visible cause.
  const requestFilters = readRequestFilters(searchParams);

  function removeFilters(keys) {
    const qs = queryWithoutFilters(searchParams, keys);
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function chipLabel({ key, value }) {
    if (key === "property_type") return translate(`buildingTypes.${value}`, value);
    const template = translate(
      key === "bedrooms"
        ? "lenaqar.opportunities.chipRooms"
        : key === "min_price"
          ? "lenaqar.opportunities.chipMinPrice"
          : "lenaqar.opportunities.chipMaxPrice",
    );
    return template
      .replace("{count}", String(value))
      .replace("{value}", formatPrice(value));
  }

  return (
    <form
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const nextCash = cashFromParam(cash);
        const delivery = String(form.get("delivery") || "").trim();
        trackEvent(ANALYTICS.EVENTS.OPPORTUNITY_FILTER_APPLIED, {
          city: location.city,
          district: location.district,
          has_delivery: Boolean(delivery),
          cash_bucket: cashBucket(nextCash),
        });
        apply({
          city: location.city,
          district: location.district,
          sub_district: location.sub_district,
          project: location.project,
          cash: nextCash === "" ? "" : String(nextCash),
          delivery,
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
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          value={formatPrice(cash)}
          onChange={(event) => setCash(parseMoneyInput(event.target.value))}
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

      {requestFilters.length > 0 ? (
        <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-black/60">
            {translate("lenaqar.opportunities.requestFilters")}
          </span>
          {requestFilters.map((filter) => {
            const label = chipLabel(filter);
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => removeFilters([filter.key])}
                aria-label={`${translate("lenaqar.opportunities.removeFilter")}: ${label}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 ps-3 pe-2.5 text-sm font-medium text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span>{label}</span>
                <X aria-hidden="true" className="size-4 shrink-0" />
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => removeFilters(REQUEST_FILTER_KEYS)}
            className="inline-flex items-center rounded-md px-2 text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {translate("lenaqar.opportunities.clearRequestFilters")}
          </button>
        </div>
      ) : null}

      <button
        type="submit"
        className="sm:col-span-2 rounded-md bg-primary text-white font-medium py-2 px-4 text-sm"
      >
        {translate("lenaqar.opportunities.apply")}
      </button>
    </form>
  );
}
