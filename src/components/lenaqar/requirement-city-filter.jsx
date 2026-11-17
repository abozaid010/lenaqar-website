"use client";

import { useI18n } from "@/hooks/useI18n";
import { MARKETPLACE_CITY_FILTERS } from "@/lib/lenaqar/marketplace-city-filters";

/**
 * City chips for the public requirements feed. `value` is a
 * MARKETPLACE_CITY_FILTERS value, or "" for all cities.
 */
export default function RequirementCityFilter({
  value,
  onChange,
  className = "",
}) {
  const { translate } = useI18n();
  const options = [
    { value: "", label: translate("lenaqar.marketplace.filter.all") },
    ...MARKETPLACE_CITY_FILTERS,
  ];

  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      role="group"
      aria-label={translate("lenaqar.marketplace.filter.cityLabel")}
    >
      {options.map((city) => {
        const active = value === city.value;
        return (
          <button
            key={city.value || "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(city.value)}
            className={`min-h-10 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-primary text-white"
                : "border border-primary/20 bg-white text-primary hover:bg-primary/5"
            }`}
          >
            {city.label}
          </button>
        );
      })}
    </div>
  );
}
