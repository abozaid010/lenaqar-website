"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseYearMonth(value) {
  const match = String(value || "").trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) return null;
  return { year, month };
}

function toYearMonth(year, month) {
  return `${year}-${pad2(month)}`;
}

function parseBound(bound, fallback) {
  return parseYearMonth(bound) || fallback;
}

function clampYearMonth(year, month, min, max) {
  let y = year;
  let m = month;
  const candidate = y * 12 + m;
  const minN = min.year * 12 + min.month;
  const maxN = max.year * 12 + max.month;
  if (candidate < minN) return { year: min.year, month: min.month };
  if (candidate > maxN) return { year: max.year, month: max.month };
  return { year: y, month: m };
}

function monthName(monthIndex0, locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    month: "long",
  }).format(new Date(2020, monthIndex0, 1));
}

function formatDisplay(value, locale) {
  const parsed = parseYearMonth(value);
  if (!parsed) return "";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(parsed.year, parsed.month - 1, 1));
}

/**
 * Localized month/year picker. Stores ASCII YYYY-MM; displays Arabic/English month names.
 */
export default function MonthYearField({
  name,
  label,
  value = "",
  onChange,
  min,
  max,
  required = false,
  error = false,
  errorMessage = "",
  disabled = false,
  locale = "ar",
  className = "",
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const now = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, []);

  const minBound = useMemo(
    () => parseBound(min, { year: now.year - 2, month: now.month }),
    [min, now.month, now.year],
  );
  const maxBound = useMemo(
    () => parseBound(max, { year: now.year + 15, month: now.month }),
    [max, now.month, now.year],
  );

  const selected = parseYearMonth(value);
  const [viewYear, setViewYear] = useState(
    () => selected?.year ?? clampYearMonth(now.year, now.month, minBound, maxBound).year,
  );

  useEffect(() => {
    if (!open) return;
    setViewYear(selected?.year ?? clampYearMonth(now.year, now.month, minBound, maxBound).year);
  }, [open, selected?.year, now.year, now.month, minBound, maxBound]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  const hasValue = Boolean(selected);
  const hasError = Boolean(error) || Boolean(errorMessage);
  const displayError = typeof error === "string" ? error : errorMessage;
  const shouldFloatLabel = open || isFocused || hasValue;
  const displayText = formatDisplay(value, locale);

  const emit = (next) => {
    onChange?.({ target: { name, value: next } });
  };

  const canShowMonth = (month) => {
    const n = viewYear * 12 + month;
    return n >= minBound.year * 12 + minBound.month && n <= maxBound.year * 12 + maxBound.month;
  };

  const canPrevYear = viewYear > minBound.year;
  const canNextYear = viewYear < maxBound.year;

  const getBorderColor = () => {
    if (disabled) return "border-gray-300";
    if (hasError) return "border-red-500";
    if (open || isFocused) return "border-primary";
    if (hasValue) return "border-gray-700";
    return "border-gray-300";
  };

  const getLabelColor = () => {
    if (disabled) return "text-gray-400";
    if (hasError) return "text-red-500";
    if (open || isFocused) return "text-primary";
    if (hasValue) return "text-gray-700";
    return "text-gray-700";
  };

  return (
    <div
      ref={rootRef}
      className={`relative transition-all duration-200 ${open ? "z-[90]" : ""} ${className}`}
    >
      <div className="relative">
        {label ? (
          <label
            htmlFor={name}
            className={`absolute transition-all duration-200 pointer-events-none z-[1] start-3 ${
              shouldFloatLabel
                ? `-top-2.5 text-xs ${getLabelColor()} bg-white px-1.5`
                : "top-1/2 text-sm text-gray-400 transform -translate-y-1/2"
            } ${required && shouldFloatLabel ? "after:content-['*'] after:text-red-500 after:ms-0.5" : ""}`}
          >
            {label}
          </label>
        ) : null}

        <div
          className={`relative flex items-stretch w-full min-h-[40px] rounded-md border bg-white transition-all duration-200 ${
            shouldFloatLabel && label ? "pt-1" : ""
          } ${getBorderColor()} ${
            hasError
              ? "ring-2 ring-red-500"
              : open || isFocused
                ? "ring-2 ring-primary"
                : ""
          } ${disabled ? "bg-gray-50 cursor-not-allowed" : ""}`}
        >
          <button
            type="button"
            id={name}
            name={name}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => {
              if (disabled) return;
              setOpen((prev) => !prev);
              setIsFocused(true);
            }}
            className={`flex-1 min-w-0 py-2.5 ps-3 pe-1 text-start bg-transparent border-0 rounded-md focus:outline-none ${
              shouldFloatLabel && label ? "pt-3 pb-2" : ""
            } ${disabled ? "text-gray-400 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`truncate block w-full text-sm text-start ${
                hasValue
                  ? "text-gray-900"
                  : shouldFloatLabel && label
                    ? "text-transparent"
                    : "text-gray-400"
              }`}
            >
              {displayText || "\u00a0"}
            </span>
          </button>

          <div className="flex items-center shrink-0 gap-0.5 pe-2 self-center">
            {hasValue && !disabled ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  emit("");
                  setOpen(false);
                }}
                className="inline-flex items-center justify-center p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label={locale === "ar" ? "مسح" : "Clear"}
              >
                <X size={16} className="text-gray-400" />
              </button>
            ) : (
              !disabled && (
                <span
                  className={`inline-flex items-center justify-center p-0.5 pointer-events-none transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                  aria-hidden
                >
                  <ChevronDown size={16} className="text-gray-400" />
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {open && !disabled ? (
        <div
          role="dialog"
          aria-label={label || (locale === "ar" ? "اختيار الشهر" : "Choose month")}
          className="absolute z-[100] mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg p-3"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              disabled={!canPrevYear}
              onClick={() => setViewYear((y) => y - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              aria-label={locale === "ar" ? "السنة السابقة" : "Previous year"}
            >
              <ChevronLeft size={16} className="rtl:rotate-180" />
            </button>
            <p className="text-sm font-semibold text-gray-900 tabular-nums" dir="ltr">
              {viewYear}
            </p>
            <button
              type="button"
              disabled={!canNextYear}
              onClick={() => setViewYear((y) => y + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              aria-label={locale === "ar" ? "السنة التالية" : "Next year"}
            >
              <ChevronRight size={16} className="rtl:rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 12 }, (_, index) => {
              const month = index + 1;
              const enabled = canShowMonth(month);
              const isSelected =
                selected?.year === viewYear && selected?.month === month;
              return (
                <button
                  key={month}
                  type="button"
                  disabled={!enabled}
                  onClick={() => {
                    const next = clampYearMonth(viewYear, month, minBound, maxBound);
                    emit(toYearMonth(next.year, next.month));
                    setOpen(false);
                    setIsFocused(false);
                  }}
                  className={`min-h-[40px] rounded-md px-1 text-sm transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
                    isSelected
                      ? "bg-primary text-white font-medium"
                      : "hover:bg-primary/10 text-gray-800"
                  }`}
                >
                  {monthName(index, locale)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasError && displayError ? (
        <p role="alert" className="text-xs sm:text-sm mt-1.5 px-0.5 leading-snug text-red-600">
          {displayError}
        </p>
      ) : null}
    </div>
  );
}
