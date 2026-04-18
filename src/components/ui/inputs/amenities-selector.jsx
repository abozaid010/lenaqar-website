"use client";

import { DEFAULT_PROJECT_AMENITIES } from "@/constants/project-amenities";
import {
  buildAmenityOptions,
  getAmenityLabel,
  normalizeAmenityKey,
  normalizeAmenitiesArray,
  resolveCanonicalAmenityValue,
} from "@/utils/project-amenities";
import { useOnClickOutside } from "@/hooks/use-click-outside";
import { Check, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Chip + searchable multi-select for project amenities. Value is always `string[]` (normalized lowercase keys).
 */
export default function AmenitiesSelector({
  value = [],
  onChange,
  options = DEFAULT_PROJECT_AMENITIES,
  allowCustom = true,
  disabled = false,
  placeholder = "Search or add amenities…",
  label = "Project amenities",
  error = false,
  errorMessage,
  id: idProp,
  /** `"ar"` shows Arabic labels in chips and list; anything else uses English. */
  locale = "en",
}) {
  const reactId = useId();
  const baseId = idProp || `amenities-${reactId}`;
  const listboxId = `${baseId}-listbox`;
  const inputId = `${baseId}-input`;

  const normalizedValue = useMemo(() => normalizeAmenitiesArray(value), [value]);
  const optionList = useMemo(
    () => buildAmenityOptions(normalizedValue, options),
    [normalizedValue, options]
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = normalizeAmenityKey(query);
    const rawQ = query.trim();
    if (!q) return optionList;
    return optionList.filter((opt) => {
      if (opt.includes(q)) return true;
      const en = getAmenityLabel(opt, "en").toLowerCase();
      const ar = getAmenityLabel(opt, "ar");
      if (en.includes(q)) return true;
      if (rawQ && ar.includes(rawQ)) return true;
      return false;
    });
  }, [optionList, query]);

  useEffect(() => {
    setHighlighted(0);
  }, [query, open, filtered.length]);

  useOnClickOutside(rootRef, () => setOpen(false));

  const toggle = useCallback(
    (keyRaw) => {
      const key = resolveCanonicalAmenityValue(normalizeAmenityKey(keyRaw));
      if (!key) return;
      const next = normalizedValue.includes(key)
        ? normalizedValue.filter((x) => x !== key)
        : [...normalizedValue, key];
      onChange?.(next);
    },
    [normalizedValue, onChange]
  );

  const remove = useCallback(
    (keyRaw) => {
      const key = resolveCanonicalAmenityValue(normalizeAmenityKey(keyRaw));
      if (!key) return;
      onChange?.(normalizedValue.filter((x) => x !== key));
    },
    [normalizedValue, onChange]
  );

  const addCustom = useCallback(() => {
    if (!allowCustom || disabled) return;
    const key = resolveCanonicalAmenityValue(normalizeAmenityKey(query));
    if (!key) return;
    if (normalizedValue.includes(key)) {
      setQuery("");
      return;
    }
    onChange?.([...normalizedValue, key]);
    setQuery("");
    setOpen(true);
  }, [allowCustom, disabled, query, normalizedValue, onChange]);

  const onInputKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
      return;
    }
    if (e.key === "Backspace" && query === "") {
      if (normalizedValue.length > 0) {
        e.preventDefault();
        onChange?.(normalizedValue.slice(0, -1));
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else
        setHighlighted((h) =>
          filtered.length ? Math.min(h + 1, filtered.length - 1) : 0
        );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (filtered.length ? Math.max(h - 1, 0) : 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered.length > 0 && filtered[highlighted] !== undefined) {
        toggle(filtered[highlighted]);
        setQuery("");
        return;
      }
      if (allowCustom && query.trim()) {
        addCustom();
      }
      return;
    }
  };

  const listItemKeyDown = (e, opt) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(opt);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div ref={rootRef} className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={`mb-1 block text-sm font-medium ${error ? "text-red-600" : "text-gray-700"}`}
        >
          {label}
        </label>
      )}
      {error && errorMessage && (
        <p id={`${baseId}-error`} className="mb-1 text-xs text-red-600" role="alert">
          {errorMessage}
        </p>
      )}

      <div
        className={`rounded-md border bg-white p-2 ${
          error ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"
        } ${disabled ? "bg-gray-50 opacity-70" : ""}`}
      >
        {normalizedValue.length > 0 && (
          <div
            className="mb-2 flex flex-wrap gap-1.5"
            role="list"
            aria-label="Selected amenities"
          >
            {normalizedValue.map((amenity) => (
              <button
                key={amenity}
                type="button"
                role="listitem"
                disabled={disabled}
                onClick={() => remove(amenity)}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none"
                aria-label={`Remove ${getAmenityLabel(amenity, locale)}`}
              >
                <span className="truncate">{getAmenityLabel(amenity, locale)}</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-invalid={error || undefined}
            aria-describedby={error && errorMessage ? `${baseId}-error` : undefined}
            disabled={disabled}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => !disabled && setOpen(true)}
            onKeyDown={onInputKeyDown}
            className="w-full min-h-[40px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed"
          />

          {open && !disabled && (
            <ul
              id={listboxId}
              role="listbox"
              aria-multiselectable="true"
              className="absolute left-0 right-0 z-[80] mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            >
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500" role="presentation">
                  {allowCustom && query.trim()
                    ? "Press Enter to add this amenity"
                    : "No matches"}
                </li>
              )}
              {filtered.map((opt, index) => {
                const selected = normalizedValue.includes(opt);
                const isHi = index === highlighted;
                return (
                  <li
                    key={opt}
                    role="option"
                    aria-selected={selected}
                    className={`${
                      isHi ? "bg-gray-100" : ""
                    } ${selected ? "bg-blue-50/80" : ""}`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 focus:bg-gray-100 focus:outline-none"
                      onClick={() => {
                        toggle(opt);
                        setQuery("");
                      }}
                      onKeyDown={(e) => listItemKeyDown(e, opt)}
                      onMouseEnter={() => setHighlighted(index)}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          selected
                            ? "border-primary bg-primary text-white"
                            : "border-gray-300 bg-white text-transparent"
                        }`}
                        aria-hidden
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      <span className="flex-1">{getAmenityLabel(opt, locale)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {allowCustom &&
          query.trim() &&
          !filtered.includes(
            resolveCanonicalAmenityValue(normalizeAmenityKey(query))
          ) && (
          <p className="mt-1 text-xs text-gray-500">
            Press Enter to add “
            {getAmenityLabel(
              resolveCanonicalAmenityValue(normalizeAmenityKey(query)),
              locale
            )}
            ”
          </p>
        )}
      </div>
    </div>
  );
}
