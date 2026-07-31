"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { useI18n } from "@/hooks/useI18n";
import CityManager from "@/utils/city_manager";

function normalizeQuery(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F]/g, "")
    .trim();
}

function joinPath(parts) {
  return parts.filter(Boolean).join(" › ");
}

function matchesBlob(haystack, query) {
  const q = normalizeQuery(query);
  if (!q) return true;
  if (haystack.includes(q)) return true;
  const words = q.split(/\s+/).filter((w) => w.length >= 2 || q.length <= 3);
  if (words.length === 0) return true;
  return words.every((word) => haystack.includes(word));
}

function optionKey(kind, parts) {
  return `${kind}:${parts.map((p) => normalizeQuery(p)).join("|")}`;
}

/**
 * Combined location picker: search and pick city, district, or sub-district.
 * Unlike leaf-only pickers, any hierarchy level is selectable in the UI;
 * callers that require a leaf should validate with `validateLocationLeaf`.
 */
export default function UnitsLocationSearch({
  city = "",
  district = "",
  subDistrict = "",
  onChange,
  name = "units_location_search",
  label,
  className = "",
  buttonClassName = "",
  showAllOption = true,
  allOptionLabel,
  placeholder,
  disabled = false,
  required = false,
  error = false,
  errorMessage = "",
}) {
  const { locale, translate } = useI18n();
  const cityManager = CityManager.getInstance();

  const [geoLoading, setGeoLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setGeoLoading(true);
        await cityManager.initializeData();
        if (cancelled) return;
        setCities(await cityManager.getCities());
        setDistricts(await cityManager.getDistricts());
        setSubDistricts(await cityManager.getSubDistricts());
      } catch (err) {
        console.error("Failed to load location index:", err?.message ?? err);
        if (!cancelled) {
          setCities([]);
          setDistricts([]);
          setSubDistricts([]);
        }
      } finally {
        if (!cancelled) setGeoLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cityManager]);

  const labelFor = useCallback(
    (en, ar) => (locale === "ar" ? ar || en : en || ar) || "",
    [locale],
  );

  const options = useMemo(() => {
    const rows = [];

    for (const cityRow of cities) {
      const optLabel = labelFor(cityRow.en_name, cityRow.ar_name);
      const searchText = normalizeQuery(
        [cityRow.en_name, cityRow.ar_name, cityRow.value].filter(Boolean).join(" "),
      );
      rows.push({
        key: optionKey("city", [cityRow.value]),
        kind: "city",
        value: cityRow.value,
        label: optLabel,
        path: "",
        kindLabel: translate("basicDetails.city", "City"),
        searchText,
        payload: { city: cityRow.value, district: "", sub_district: "" },
      });
    }

    for (const districtRow of districts) {
      const cityValue = normalizeQuery(districtRow.city_en_name);
      const optLabel = labelFor(districtRow.en_name, districtRow.ar_name);
      const path = labelFor(districtRow.city_en_name, districtRow.city_ar_name);
      const aliases = Array.isArray(districtRow.aliases) ? districtRow.aliases : [];
      const searchText = normalizeQuery(
        [districtRow.en_name, districtRow.ar_name, districtRow.value, path, ...aliases]
          .filter(Boolean)
          .join(" "),
      );
      rows.push({
        key: optionKey("district", [cityValue, districtRow.value]),
        kind: "district",
        value: districtRow.value,
        label: optLabel,
        path,
        kindLabel: translate("basicDetails.district", "District"),
        searchText,
        payload: {
          city: cityValue,
          district: districtRow.value,
          sub_district: "",
        },
      });
    }

    for (const sub of subDistricts) {
      const cityValue = normalizeQuery(sub.city_en_name);
      const districtValue = normalizeQuery(sub.district_value);
      const districtMeta = districts.find(
        (d) =>
          normalizeQuery(d.city_en_name) === cityValue &&
          normalizeQuery(d.value) === districtValue,
      );
      const optLabel = labelFor(sub.en_name, sub.ar_name);
      const path = joinPath([
        labelFor(sub.city_en_name, sub.city_ar_name),
        labelFor(
          districtMeta?.en_name || sub.district_value,
          districtMeta?.ar_name || sub.district_value,
        ),
      ]);
      const aliases = Array.isArray(sub.aliases) ? sub.aliases : [];
      const searchText = normalizeQuery(
        [
          sub.en_name,
          sub.ar_name,
          sub.value,
          sub.city_en_name,
          sub.district_value,
          districtMeta?.en_name,
          districtMeta?.ar_name,
          ...aliases,
        ]
          .filter(Boolean)
          .join(" "),
      );
      rows.push({
        key: optionKey("sub_district", [cityValue, districtValue, sub.value]),
        kind: "sub_district",
        value: sub.value,
        label: optLabel,
        path,
        kindLabel: translate("basicDetails.subDistrict", "Sub-district"),
        searchText,
        payload: {
          city: cityValue,
          district: districtValue,
          sub_district: sub.value,
        },
      });
    }

    const kindRank = { sub_district: 0, district: 1, city: 2 };
    return rows.sort((a, b) => {
      const rank = (kindRank[a.kind] ?? 9) - (kindRank[b.kind] ?? 9);
      if (rank !== 0) return rank;
      return a.label.localeCompare(b.label, locale, { sensitivity: "base" });
    });
  }, [cities, districts, subDistricts, labelFor, locale, translate]);

  const selectedKey = useMemo(() => {
    const c = normalizeQuery(city);
    const d = normalizeQuery(district);
    const s = normalizeQuery(subDistrict);
    if (s && c && d) return optionKey("sub_district", [c, d, s]);
    if (d && c) return optionKey("district", [c, d]);
    if (c) return optionKey("city", [c]);
    return "";
  }, [city, district, subDistrict]);

  const selectedSummary = useMemo(() => {
    const opt = options.find((row) => row.key === selectedKey);
    if (!opt) {
      const fallback = joinPath([city, district, subDistrict].map(normalizeQuery));
      return { title: fallback, path: "" };
    }
    return { title: opt.label, path: opt.path, kindLabel: opt.kindLabel };
  }, [options, selectedKey, city, district, subDistrict]);

  const handleChange = (e) => {
    const key = e?.target?.value ?? "";
    if (!key) {
      onChange?.({ city: "", district: "", sub_district: "" });
      return;
    }
    const opt = options.find((row) => row.key === key);
    if (!opt) return;
    onChange?.(opt.payload);
  };

  const resolvedAllLabel =
    allOptionLabel || translate("unitsFilter.allLocations", "All Locations");
  const resolvedPlaceholder = placeholder || resolvedAllLabel;

  return (
    <SearchableDropdownSelect
      name={name}
      label={label}
      options={options}
      value={selectedKey}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      error={error}
      errorMessage={errorMessage}
      isLoading={geoLoading}
      showAllOption={showAllOption}
      allOptionLabel={resolvedAllLabel}
      allOptionValue=""
      placeholder={resolvedPlaceholder}
      searchPlaceholder={translate(
        "unitsFilter.locationSearchPlaceholder",
        "Search city, district, or area…",
      )}
      noResultsText={translate(
        "unitsFilter.locationSearchEmpty",
        "No matching locations",
      )}
      className={className}
      buttonClassName={buttonClassName}
      getValue={(opt) => opt.key}
      getLabel={(opt) => opt.label}
      getKey={(opt) => opt.key}
      searchFields={(opt, query) => matchesBlob(opt.searchText, query)}
      renderOption={(opt, _index, isSelected) => (
        <div className="flex flex-col gap-0.5 min-w-0 text-start">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-sm font-medium truncate ${
                isSelected ? "text-primary" : "text-gray-900"
              }`}
            >
              {opt.label}
            </span>
            <span className="shrink-0 text-[10px] uppercase tracking-wide text-gray-400">
              {opt.kindLabel}
            </span>
          </div>
          {opt.path ? (
            <span className="text-xs text-gray-500 truncate">{opt.path}</span>
          ) : null}
        </div>
      )}
      resolveSelectedLabel={() => {
        if (!selectedKey) return resolvedAllLabel;
        if (selectedSummary.title && selectedSummary.path) {
          return `${selectedSummary.title} · ${selectedSummary.path}`;
        }
        return selectedSummary.title || resolvedAllLabel;
      }}
    />
  );
}
