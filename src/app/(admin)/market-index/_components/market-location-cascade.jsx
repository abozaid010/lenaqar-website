"use client";

import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { useI18n } from "@/hooks/useI18n";
import {
  useLocationChildren,
  useLocationRoots,
} from "@/hooks/use-market-index";
import { locationLabel } from "./location-label";

function levelLabelKey(index) {
  if (index === 0) return "city";
  if (index === 1) return "district";
  return "area";
}

function LocationLevelSelect({
  parentId,
  value,
  onPick,
  label,
  placeholder,
  disabled,
  error,
}) {
  const { locale } = useI18n();
  const rootsQuery = useLocationRoots(!parentId);
  const childrenQuery = useLocationChildren(parentId || null);
  const query = parentId ? childrenQuery : rootsQuery;
  const locations = Array.isArray(query.data?.locations)
    ? query.data.locations
    : [];
  const options = locations.map((node) => ({
    value: node.id,
    label: locationLabel(node, locale),
    node,
  }));

  return (
    <SearchableDropdownSelect
      name={parentId ? `loc_${parentId}` : "loc_city"}
      label={label}
      options={options}
      value={value}
      onChange={(e) => onPick(e.target.value, options)}
      disabled={disabled}
      error={error}
      placeholder={placeholder}
      isLoading={query.isLoading}
      getValue={(opt) => opt.value}
      getLabel={(opt) => opt.label}
      searchFields={["label", "value"]}
    />
  );
}

/**
 * Cascading searchable location dropdowns (city → district → area),
 * matching SearchableCitySelect / SearchableDistrictSelect UX.
 *
 * `path` = selected non-leaf ancestors; `leaf` = selected leaf node or null.
 */
export default function MarketLocationCascade({
  path,
  onPathChange,
  leaf,
  onLeafChange,
  disabled = false,
  error = null,
}) {
  const { translate } = useI18n();

  const handleSelectAt = (index, nodeId, options) => {
    const selected = options.find((o) => o.value === nodeId)?.node;
    if (!selected) {
      onPathChange(path.slice(0, index));
      onLeafChange(null);
      return;
    }
    if (selected.is_leaf) {
      onPathChange(path.slice(0, index));
      onLeafChange(selected);
      return;
    }
    onLeafChange(null);
    onPathChange([...path.slice(0, index), selected]);
  };

  // One dropdown per ancestor + one for the current/next choice (leaf or next parent).
  const rowCount = path.length + 1;
  const rows = Array.from({ length: rowCount }, (_, i) => ({
    index: i,
    parentId: i === 0 ? null : path[i - 1].id,
    value: i < path.length ? path[i].id : leaf?.id || "",
    isCurrent: i === path.length,
  }));

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <LocationLevelSelect
          key={row.parentId || "roots"}
          parentId={row.parentId}
          value={row.value}
          label={translate(`marketEvaluate.location.${levelLabelKey(row.index)}`)}
          placeholder={translate("marketEvaluate.form.select")}
          disabled={disabled}
          error={row.isCurrent ? error : null}
          onPick={(nodeId, options) =>
            handleSelectAt(row.index, nodeId, options)
          }
        />
      ))}
      {!leaf && (
        <p className="text-xs text-gray-500">
          {translate("marketEvaluate.picker.leafHint")}
        </p>
      )}
    </div>
  );
}
