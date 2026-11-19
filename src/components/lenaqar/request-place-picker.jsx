"use client";

import { useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useLocationsGeo } from "@/hooks/use-locations-geo";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { placeAr } from "@/lib/lenaqar/listing-seo";
import { localizedPlaceName } from "@/lib/lenaqar/place-display";
import {
  DEFAULT_REQUEST_PLACES,
  MAX_REQUEST_PLACES,
  addPlace,
  isCoveredByCity,
  isSelected,
  placeKey,
  removePlace,
  searchPlaces,
  togglePlace,
  typedPlace,
} from "@/lib/lenaqar/request-places";

const DEFAULT_KEYS = new Set(DEFAULT_REQUEST_PLACES.map(placeKey));

const chipBase =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
const chipOff = "border-gray-300 bg-white text-gray-800 hover:border-gray-400";
const chipOn = "border-primary bg-primary text-white";
const chipCovered = "border-primary/30 bg-primary/10 text-primary";

/**
 * Where the buyer wants to live: tap one or more of the usual areas, or type
 * any other place or compound. `value` / `onChange` carry the list of places
 * (see `request-places.js`).
 */
export default function RequestPlacePicker({
  value = [],
  onChange,
  projects = [],
  enabled = true,
  error = "",
}) {
  const { translate, locale } = useI18n();
  const t = (key) => translate(`lenaqar.buyRequest.places.${key}`);
  const { data: geo } = useLocationsGeo({ enabled });
  const [query, setQuery] = useState("");
  const [limitHit, setLimitHit] = useState(false);

  const sources = useMemo(
    () => ({
      cities: geo?.cities || [],
      districts: geo?.districts || [],
      subDistricts: geo?.subDistricts || [],
      projects,
    }),
    [geo, projects],
  );
  const results = useMemo(() => searchPlaces(query, sources), [query, sources]);
  const typed = typedPlace(query);

  // The catalog row of a place's deepest level, for its Arabic name.
  const catalogRow = (place) => {
    const rows = place.sub_district
      ? sources.subDistricts
      : place.district
        ? sources.districts
        : sources.cities;
    const value = place.sub_district || place.district || place.city;
    return rows.find(
      (row) =>
        row.value === value &&
        (!row.city_en_name || row.city_en_name.toLowerCase() === place.city),
    );
  };
  const placeLabel = (place) => {
    if (place.project) {
      const known = projects.find((row) => row.en_name === place.project);
      return known ? localizedPlaceName(known.en_name, known.ar_name, locale) : place.project;
    }
    const en = place.sub_district || place.district || place.city;
    return localizedPlaceName(en, catalogRow(place)?.ar_name || placeAr(en), locale);
  };

  const apply = ({ places, error: applyError }) => {
    setLimitHit(applyError === "placesLimit");
    onChange?.(places);
    return !applyError;
  };

  const pickResult = (place) => {
    if (apply(addPlace(value, place))) setQuery("");
  };

  // Places picked through the search: the default chips show their own state.
  const extras = value.filter((place) => !DEFAULT_KEYS.has(placeKey(place)));
  const message = limitHit
    ? t("limit").replace("{max}", String(MAX_REQUEST_PLACES))
    : error;

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-gray-800">
        {t("label")} <span className="text-red-600">*</span>
      </legend>
      <p className="text-xs text-gray-600">{t("hint")}</p>

      <div className="flex flex-wrap gap-2">
        {DEFAULT_REQUEST_PLACES.map((place) => {
          const selected = isSelected(value, place);
          const covered = !selected && isCoveredByCity(value, place);
          return (
            <button
              key={place.labelKey}
              type="button"
              aria-pressed={selected || covered}
              disabled={covered}
              onClick={() => apply(togglePlace(value, place))}
              className={`${chipBase} ${selected ? chipOn : covered ? chipCovered : chipOff}`}
            >
              {selected || covered ? (
                <Check aria-hidden="true" className="size-4 shrink-0" />
              ) : null}
              {translate(`lenaqar.buyRequest.placeChips.${place.labelKey}`)}
            </button>
          );
        })}
      </div>

      {extras.length ? (
        <ul className="flex flex-wrap gap-2">
          {extras.map((place) => (
            <li key={placeKey(place)}>
              <span className={`${chipBase} ${chipOn} pe-1.5`}>
                {placeLabel(place)}
                <button
                  type="button"
                  aria-label={`${t("remove")} ${placeLabel(place)}`}
                  onClick={() => apply({ places: removePlace(value, place), error: "" })}
                  className="inline-flex size-7 items-center justify-center rounded-full hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div>
        <LenaTextField
          name="request_place_search"
          label={t("searchLabel")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
        />
        {results.length || typed ? (
          <ul className="mt-1 divide-y divide-gray-100 overflow-hidden rounded-md border border-gray-200 bg-white">
            {results.map((hit) => {
              // Already picked, or inside a city picked whole: shown, not offered again.
              const included =
                isSelected(value, hit.place) || isCoveredByCity(value, hit.place);
              return (
                <li key={placeKey(hit.place)}>
                  <button
                    type="button"
                    disabled={included}
                    onClick={() => pickResult(hit.place)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-start text-sm text-gray-900 hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">
                        {localizedPlaceName(hit.en, hit.ar, locale)}
                      </span>
                      <span className="ms-2 text-xs text-gray-500">
                        {included
                          ? t("included")
                          : hit.kind === "city"
                            ? t("wholeCity")
                            : hit.kind === "project"
                              ? t("compound")
                              : localizedPlaceName(hit.parentEn, hit.parentAr, locale)}
                      </span>
                    </span>
                    {included ? (
                      <Check aria-hidden="true" className="size-4 shrink-0 text-gray-400" />
                    ) : (
                      <Plus aria-hidden="true" className="size-4 shrink-0 text-primary" />
                    )}
                  </button>
                </li>
              );
            })}
            {typed && !results.length ? (
              <li>
                <button
                  type="button"
                  onClick={() => pickResult(typed)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-start text-sm text-gray-900 hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
                >
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">
                      {t("addTyped").replace("{text}", typed.project)}
                    </span>
                    <span className="block text-xs text-gray-500">{t("addTypedHint")}</span>
                  </span>
                  <Plus aria-hidden="true" className="size-4 shrink-0 text-primary" />
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {message ? (
        <p role="alert" className="text-xs text-red-600">
          {message}
        </p>
      ) : null}
    </fieldset>
  );
}
