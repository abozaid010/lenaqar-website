"use client";

import { useLocalizedLocationLabels } from "@/hooks/use-localized-location-labels";

/**
 * Renders localized city / district / sub-district labels from cities_list.json.
 * Backend values stay canonical English; display follows active locale.
 */
export default function LocalizedLocationText({
  city = "",
  district = "",
  subDistrict = "",
  sub_district = "",
  separator = ", ",
  className = "",
  fallback = "",
}) {
  const { text } = useLocalizedLocationLabels({
    city,
    district,
    subDistrict,
    sub_district,
  });

  const content = text || fallback;
  if (!content) return null;

  return <span className={className}>{content}</span>;
}

/** Single-field localized labels */
export function LocalizedCityText({ city = "", className = "", fallback = "" }) {
  const { city: label } = useLocalizedLocationLabels({ city });
  const content = label || fallback;
  if (!content) return null;
  return <span className={className}>{content}</span>;
}

export function LocalizedDistrictText({
  city = "",
  district = "",
  className = "",
  fallback = "",
}) {
  const { district: label } = useLocalizedLocationLabels({ city, district });
  const content = label || fallback;
  if (!content) return null;
  return <span className={className}>{content}</span>;
}

export function LocalizedSubDistrictText({
  city = "",
  district = "",
  subDistrict = "",
  sub_district = "",
  className = "",
  fallback = "",
}) {
  const { subDistrict: label } = useLocalizedLocationLabels({
    city,
    district,
    subDistrict,
    sub_district,
  });
  const content = label || fallback;
  if (!content) return null;
  return <span className={className}>{content}</span>;
}
