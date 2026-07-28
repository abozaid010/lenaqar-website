"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useActionOptions } from "@/hooks/use-action-catalog";

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
  const [menuPosition, setMenuPosition] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const triggerLabel = useMemo(() => {
    if (!values?.length) return emptyLabel;
    if (values.length === 1) {
      return options.find((o) => o.value === values[0])?.label || values[0];
    }
    return selectedLabelTemplate.replace("{count}", String(values.length));
  }, [values, options, emptyLabel, selectedLabelTemplate]);

  // Portal + fixed position so the menu escapes filter-panel overflow/stacking
  // (same pattern as the dashboard date picker).
  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    const MARGIN = 8;
    const GAP = 4;
    const MAX_PANEL_HEIGHT = 256;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(Math.max(rect.width, 200), vw - MARGIN * 2);
      const left = Math.min(
        Math.max(MARGIN, rect.left),
        Math.max(MARGIN, vw - width - MARGIN),
      );

      const spaceBelow = vh - rect.bottom - GAP - MARGIN;
      const spaceAbove = rect.top - GAP - MARGIN;
      const openUpward =
        spaceBelow < Math.min(MAX_PANEL_HEIGHT, 160) && spaceAbove > spaceBelow;

      if (openUpward) {
        setMenuPosition({
          top: undefined,
          bottom: Math.max(MARGIN, vh - rect.top + GAP),
          left,
          width,
          maxHeight: Math.min(MAX_PANEL_HEIGHT, Math.max(120, spaceAbove)),
        });
      } else {
        const top = Math.min(rect.bottom + GAP, vh - MARGIN - 120);
        setMenuPosition({
          top: Math.max(MARGIN, top),
          bottom: undefined,
          left,
          width,
          maxHeight: Math.min(
            MAX_PANEL_HEIGHT,
            Math.max(120, vh - Math.max(MARGIN, top) - MARGIN),
          ),
        });
      }
    };

    updatePosition();
    const rafId = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      const target = event.target;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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
    <div className={`relative flex flex-col ${className}`}>
      <div
        ref={triggerRef}
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

      {open &&
        menuPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            aria-multiselectable
            className="fixed z-[300] rounded-md border border-gray-200 bg-white p-2 shadow-xl overflow-y-auto overscroll-contain"
            style={{
              top: menuPosition.top,
              bottom: menuPosition.bottom,
              left: menuPosition.left,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
            }}
          >
            {values.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="mb-1 w-full rounded px-2 py-1.5 text-start text-xs font-semibold text-primary hover:bg-primary/5"
              >
                {clearAllLabel}
              </button>
            )}
            <ul className="flex flex-col gap-0.5">
              {options.map((option) => (
                <li key={option.value} role="option" aria-selected={values.includes(option.value)}>
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
          </div>,
          document.body,
        )}
    </div>
  );
}
