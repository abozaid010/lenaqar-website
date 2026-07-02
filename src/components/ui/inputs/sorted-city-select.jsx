"use client";

import { useI18n } from "@/hooks/useI18n";
import SearchableCitySelect from "@/components/ui/inputs/searchable-city-select";

/**
 * CitySelect - Wrapper component for backward compatibility
 * Now uses SearchableCitySelect internally for better UX
 */
export default function CitySelect({ value, onChange, error, required, ...rest }) {
  const { t, translate } = useI18n();

  return (
    <SearchableCitySelect
      label={translate("basicDetails.city", t.basicDetails?.city)}
      name="city"
      value={value || ""}
      required={required}
      onChange={onChange}
      error={error}
      placeholder={translate("basicDetails.selectCity", t.basicDetails?.selectCity)}
      {...rest}
    />
  );
}
