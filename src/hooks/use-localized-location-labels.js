"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import CityManager from "@/utils/city_manager";

const EMPTY_LABELS = { city: "", district: "", subDistrict: "" };

/**
 * Resolve localized display labels for backend canonical location values.
 */
export function useLocalizedLocationLabels({
  city = "",
  district = "",
  subDistrict = "",
  sub_district = "",
} = {}) {
  const { locale } = useI18n();
  const subValue = subDistrict || sub_district || "";
  const [labels, setLabels] = useState(EMPTY_LABELS);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!city && !district && !subValue) {
        if (!cancelled) setLabels(EMPTY_LABELS);
        return;
      }

      try {
        const manager = CityManager.getInstance();
        const next = await manager.getLocationDisplayLabels(
          { city, district, sub_district: subValue },
          locale
        );
        if (!cancelled) setLabels(next);
      } catch (error) {
        console.error("Failed to resolve location labels:", error?.message ?? error);
        if (!cancelled) setLabels(EMPTY_LABELS);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [city, district, subValue, locale]);

  const text = useMemo(
    () => [labels.city, labels.district, labels.subDistrict].filter(Boolean).join(", "),
    [labels.city, labels.district, labels.subDistrict]
  );

  return { ...labels, text };
}
