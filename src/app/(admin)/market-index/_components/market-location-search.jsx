"use client";

import { useMemo } from "react";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { useI18n } from "@/hooks/useI18n";
import { useLocationLeaves } from "@/hooks/use-market-index";
import { locationLabel } from "./location-label";

function normalizeQuery(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F]/g, "")
    .trim();
}

function pathLabel(node) {
  const path = Array.isArray(node?.path_en) ? node.path_en : [];
  // Skip country root when present (e.g. Egypt › Cairo › …).
  const parts = path.filter((part, index) => {
    if (!part) return false;
    if (index === 0 && String(part).toLowerCase() === "egypt") return false;
    return true;
  });
  return parts.join(" › ");
}

function searchableBlob(node) {
  const aliases = Array.isArray(node?.aliases) ? node.aliases : [];
  const path = Array.isArray(node?.path_en) ? node.path_en : [];
  return [
    node?.en_name,
    node?.ar_name,
    node?.slug,
    node?.id,
    ...aliases,
    ...path,
  ]
    .filter(Boolean)
    .map((part) => normalizeQuery(part))
    .join(" ");
}

function matchesLocation(node, query) {
  const q = normalizeQuery(query);
  if (!q) return true;
  const haystack = searchableBlob(node);
  if (haystack.includes(q)) return true;
  const words = q.split(/\s+/).filter((w) => w.length >= 2 || q.length <= 3);
  if (words.length === 0) return true;
  return words.every((word) => haystack.includes(word));
}

/**
 * Single searchable field over all leaf locations.
 * Typing "Madinaty" finds the leaf; typing "New Cairo" finds all leaves under that path.
 */
export default function MarketLocationSearch({
  leaf,
  onLeafChange,
  disabled = false,
  error = null,
  enabled = true,
}) {
  const { translate, locale } = useI18n();
  const leavesQuery = useLocationLeaves(enabled);
  const locations = Array.isArray(leavesQuery.data?.locations)
    ? leavesQuery.data.locations
    : [];

  const options = useMemo(
    () =>
      locations
        .filter((node) => node?.is_leaf)
        .map((node) => ({
          value: node.id,
          label: locationLabel(node, locale),
          path: pathLabel(node),
          searchText: searchableBlob(node),
          node,
        })),
    [locations, locale],
  );

  return (
    <div className="flex flex-col gap-2">
      <SearchableDropdownSelect
        name="market_location"
        label={translate("marketEvaluate.location.searchLabel", "Location")}
        options={options}
        value={leaf?.id || ""}
        onChange={(e) => {
          const nextId = e.target.value;
          if (!nextId) {
            onLeafChange(null);
            return;
          }
          const selected = options.find((opt) => opt.value === nextId)?.node;
          onLeafChange(selected || null);
        }}
        disabled={disabled}
        error={Boolean(error)}
        errorMessage={typeof error === "string" ? error : undefined}
        placeholder={translate(
          "marketEvaluate.location.searchPlaceholder",
          "Search area, district, or city…",
        )}
        searchPlaceholder={translate(
          "marketEvaluate.location.searchPlaceholder",
          "Search area, district, or city…",
        )}
        isLoading={leavesQuery.isLoading}
        noResultsText={translate("marketEvaluate.picker.empty")}
        getValue={(opt) => opt.value}
        getLabel={(opt) => opt.label}
        searchFields={(opt, query) => matchesLocation(opt.node, query)}
        renderOption={(opt, _index, isSelected) => (
          <div className="flex flex-col gap-0.5 min-w-0 text-start">
            <span
              className={`text-sm font-medium truncate ${
                isSelected ? "text-primary" : "text-gray-900"
              }`}
            >
              {opt.label}
            </span>
            {opt.path ? (
              <span className="text-xs text-gray-500 truncate">{opt.path}</span>
            ) : null}
          </div>
        )}
        resolveSelectedLabel={(value) => {
          const selected = options.find((opt) => opt.value === value);
          if (!selected) return "";
          return selected.path
            ? `${selected.label} · ${selected.path}`
            : selected.label;
        }}
      />
      {!leaf && (
        <p className="text-xs text-gray-500">
          {translate(
            "marketEvaluate.picker.leafHint",
            "Search and pick a specific area (leaf).",
          )}
        </p>
      )}
    </div>
  );
}
