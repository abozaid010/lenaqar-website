"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useActionOptions } from "@/hooks/use-action-catalog";
import { useOnClickOutside } from "@/hooks/use-click-outside";

/**
 * Shared Action selector — single source of truth for action dropdowns.
 *
 * selectionMode:
 * - "single": native <select> for create/edit forms
 * - "multiple": checkbox list for dashboard filters
 */
export default function ActionSelect({
  selectionMode = "single",
  ownerType = null,
  ownerTypes = null,
  value = "",
  values = [],
  onChange,
  onValuesChange,
  includeFilterOnly = false,
  name = "action",
  id,
  required = false,
  disabled = false,
  className = "",
  placeholder = null,
  emptyLabel = null,
  /** When true, show catalog load/error states inline */
  showStatus = true,
}) {
  const { translate } = useI18n();
  const autoId = useId();
  const selectId = id || autoId;

  const { options, isLoading, isError, error, refetch } = useActionOptions({
    ownerType,
    ownerTypes,
    includeFilterOnly,
  });

  const resolvedPlaceholder =
    placeholder ||
    translate("actionCatalog.selectPlaceholder", "Select an action");
  const catalogErrorLabel = translate(
    "actionCatalog.errors.catalogUnavailable",
    "Action catalog unavailable. Try refreshing the page."
  );
  const loadingLabel = translate("common.loading", "Loading...");
  const retryLabel = translate("common.retry", "Retry");

  if (isLoading && showStatus) {
    return (
      <div
        className={`w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 ${className}`}
      >
        {loadingLabel}
      </div>
    );
  }

  if ((isError || (!isLoading && options.length === 0)) && showStatus) {
    return (
      <div
        className={`flex w-full flex-col gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 ${className}`}
      >
        <span>{error?.message || catalogErrorLabel}</span>
        <button
          type="button"
          onClick={() => refetch()}
          className="self-start text-xs font-semibold text-primary underline"
        >
          {retryLabel}
        </button>
      </div>
    );
  }

  if (selectionMode === "multiple") {
    return (
      <ActionMultiSelect
        id={selectId}
        options={options}
        values={values || []}
        onValuesChange={onValuesChange}
        disabled={disabled}
        className={className}
        emptyLabel={
          emptyLabel ||
          translate("dashboardFilter.actions.allActions", "All Actions")
        }
        selectedLabelTemplate={translate(
          "dashboardFilter.actions.selected",
          "{count} selected"
        )}
        clearAllLabel={translate(
          "dashboardFilter.actions.clearAll",
          "Clear All"
        )}
      />
    );
  }

  return (
    <select
      id={selectId}
      name={name}
      required={required}
      disabled={disabled || isLoading}
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      className={
        className ||
        "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      }
    >
      {!required && !value ? (
        <option value="">{resolvedPlaceholder}</option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ActionMultiSelect({
  id,
  options,
  values,
  onValuesChange,
  disabled,
  className,
  emptyLabel,
  selectedLabelTemplate,
  clearAllLabel,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false));

  const triggerLabel = useMemo(() => {
    if (!values?.length) return emptyLabel;
    if (values.length === 1) {
      return options.find((o) => o.value === values[0])?.label || values[0];
    }
    return selectedLabelTemplate.replace("{count}", String(values.length));
  }, [values, options, emptyLabel, selectedLabelTemplate]);

  const toggle = (actionValue) => {
    if (disabled) return;
    const next = values.includes(actionValue)
      ? values.filter((v) => v !== actionValue)
      : [...values, actionValue];
    onValuesChange?.(next);
  };

  const clearAll = () => {
    if (disabled) return;
    onValuesChange?.([]);
  };

  return (
    <div ref={ref} className={`relative flex flex-col ${className}`}>
      <div
        id={id}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <span className="truncate text-sm">{triggerLabel}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="absolute start-0 top-full z-[100] mt-1 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg max-h-64 overflow-y-auto">
          {values.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="mb-1 w-full rounded px-2 py-1.5 text-start text-xs font-semibold text-primary hover:bg-primary/5"
            >
              {clearAllLabel}
            </button>
          )}
          <ul role="listbox" aria-multiselectable className="flex flex-col gap-0.5">
            {options.map((option) => (
              <li key={option.value}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={values.includes(option.value)}
                    onChange={() => toggle(option.value)}
                    className="cursor-pointer"
                  />
                  <span className="truncate">{option.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
