"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useOnClickOutside } from "@/hooks/use-click-outside";
import { useFavoriteUnitSearches } from "@/hooks/use-favorite-unit-searches";
import { useI18n } from "@/hooks/useI18n";
import { hasActiveFilters } from "@/lib/units/favorite-searches";
import toast from "react-hot-toast";

function formatSavedDate(isoDate, locale) {
  if (!isoDate) return "";
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(isoDate));
  } catch {
    return "";
  }
}

function buildCompactSummary(labels, translate) {
  if (!labels.length) {
    return translate("unitsFilter.favoriteSearches.noFiltersSummary", "No filters");
  }
  const maxVisible = 2;
  const visible = labels.slice(0, maxVisible);
  const remaining = labels.length - visible.length;
  if (remaining > 0) {
    return `${visible.join(" · ")} · +${remaining}`;
  }
  return visible.join(" · ");
}

export default function UnitsFavoriteSearches({
  filters,
  activeFilterLabels = [],
  getSummaryLabels,
  onApply,
  isPublic = false,
}) {
  const { translate, locale } = useI18n();
  const { favorites, isHydrated, saveFavorite, renameFavorite, deleteFavorite } =
    useFavoriteUnitSearches(isPublic);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const panelRef = useRef(null);
  useOnClickOutside(panelRef, () => {
    if (isSaving) {
      setIsSaving(false);
      setSaveName("");
    }
    if (editingId) {
      setEditingId(null);
      setEditingName("");
    }
    setDeleteConfirmId(null);
  });

  const currentSummary = useMemo(
    () => buildCompactSummary(activeFilterLabels, translate),
    [activeFilterLabels, translate]
  );

  const handleSave = () => {
    const result = saveFavorite(saveName, filters);
    if (!result.ok) {
      if (result.error === "empty_name") {
        toast.error(
          translate(
            "unitsFilter.favoriteSearches.emptyNameError",
            "Please enter a name for this search."
          )
        );
        return;
      }
      if (result.error === "duplicate_name") {
        toast.error(
          translate(
            "unitsFilter.favoriteSearches.duplicateNameError",
            "A favorite with this name already exists. Choose a different name."
          )
        );
        return;
      }
      return;
    }

    toast.success(
      translate(
        "unitsFilter.favoriteSearches.saveSuccess",
        "Favorite search saved."
      )
    );
    setSaveName("");
    setIsSaving(false);
    setIsExpanded(true);
  };

  const handleRename = (id) => {
    const result = renameFavorite(id, editingName);
    if (!result.ok) {
      if (result.error === "empty_name") {
        toast.error(
          translate(
            "unitsFilter.favoriteSearches.emptyNameError",
            "Please enter a name for this search."
          )
        );
        return;
      }
      if (result.error === "duplicate_name") {
        toast.error(
          translate(
            "unitsFilter.favoriteSearches.duplicateNameError",
            "A favorite with this name already exists. Choose a different name."
          )
        );
        return;
      }
      return;
    }

    toast.success(
      translate(
        "unitsFilter.favoriteSearches.renameSuccess",
        "Favorite renamed."
      )
    );
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = (id) => {
    deleteFavorite(id);
    setDeleteConfirmId(null);
    toast.success(
      translate(
        "unitsFilter.favoriteSearches.deleteSuccess",
        "Favorite deleted."
      )
    );
  };

  const startSave = () => {
    setIsExpanded(true);
    setIsSaving(true);
    setSaveName("");
    setEditingId(null);
    setDeleteConfirmId(null);
  };

  return (
    <div
      ref={panelRef}
      className="rounded-lg border border-[#E6E6E6] bg-[#F6F7FB] overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex min-w-0 flex-1 items-center gap-2 text-start"
          aria-expanded={isExpanded}
        >
          <Bookmark
            size={16}
            className="shrink-0 text-primary"
            aria-hidden
          />
          <span className="truncate text-xs font-medium text-[#494A4B]">
            {translate("unitsFilter.favoriteSearches.title", "Favorite Searches")}
          </span>
          {isHydrated && favorites.length > 0 && (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {favorites.length}
            </span>
          )}
          <ChevronDown
            size={14}
            className={`ms-auto shrink-0 text-gray-500 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>

        <button
          type="button"
          onClick={startSave}
          className="inline-flex h-10 min-h-10 lg:h-8 lg:min-h-8 shrink-0 items-center gap-1 rounded-md border border-primary/20 bg-white px-2.5 lg:px-2 text-xs lg:text-[11px] font-medium text-primary hover:bg-primary/5 transition-colors"
          title={translate(
            "unitsFilter.favoriteSearches.saveCurrent",
            "Save current filters"
          )}
        >
          <Plus size={14} aria-hidden />
          <span className="hidden sm:inline">
            {translate("unitsFilter.favoriteSearches.save", "Save")}
          </span>
        </button>
      </div>

      {isSaving && (
        <div className="border-t border-[#E6E6E6] bg-white px-3 py-2 space-y-2">
          <p className="text-[11px] text-gray-500 truncate" title={currentSummary}>
            {translate("unitsFilter.favoriteSearches.savingPreview", "Saving:")}{" "}
            {currentSummary}
          </p>
          {!hasActiveFilters(filters) && (
            <p className="text-[11px] text-amber-700">
              {translate(
                "unitsFilter.favoriteSearches.noActiveFiltersHint",
                "No filters are currently selected."
              )}
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setIsSaving(false);
                  setSaveName("");
                }
              }}
              placeholder={translate(
                "unitsFilter.favoriteSearches.namePlaceholder",
                "Name this search…"
              )}
              className="h-11 min-h-11 lg:h-9 lg:min-h-9 min-w-0 flex-1 rounded-md border border-[#E6E6E6] px-2 text-base lg:text-xs text-[#494A4B] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
              maxLength={60}
            />
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-11 w-11 min-h-11 min-w-11 lg:h-9 lg:w-9 lg:min-h-9 lg:min-w-9 items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
              aria-label={translate("unitsFilter.favoriteSearches.save", "Save")}
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSaving(false);
                setSaveName("");
              }}
              className="inline-flex h-11 w-11 min-h-11 min-w-11 lg:h-9 lg:w-9 lg:min-h-9 lg:min-w-9 items-center justify-center rounded-md border border-[#E6E6E6] bg-white text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label={translate("buttons.cancel", "Cancel")}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="border-t border-[#E6E6E6] bg-white">
          {!isHydrated ? (
            <div className="px-3 py-3 text-xs text-gray-500">
              {translate("unitsFilter.favoriteSearches.loading", "Loading favorites…")}
            </div>
          ) : favorites.length === 0 ? (
            <div className="px-3 py-3 text-xs text-gray-500">
              {translate(
                "unitsFilter.favoriteSearches.empty",
                "No favorite searches yet. Set your filters and tap Save."
              )}
            </div>
          ) : (
            <ul className="max-h-56 overflow-y-auto divide-y divide-[#F0F0F0]">
              {favorites.map((favorite) => {
                const summary = buildCompactSummary(
                  getSummaryLabels?.(favorite.filters) || activeFilterLabels,
                  translate
                );
                const savedDate = formatSavedDate(favorite.savedAt, locale);
                const isEditing = editingId === favorite.id;
                const isDeleting = deleteConfirmId === favorite.id;

                return (
                  <li key={favorite.id} className="px-3 py-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(favorite.id);
                            if (e.key === "Escape") {
                              setEditingId(null);
                              setEditingName("");
                            }
                          }}
                          className="h-11 min-h-11 lg:h-8 lg:min-h-8 min-w-0 flex-1 rounded-md border border-[#E6E6E6] px-2 text-base lg:text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          autoFocus
                          maxLength={60}
                        />
                        <button
                          type="button"
                          onClick={() => handleRename(favorite.id)}
                          className="inline-flex h-10 w-10 min-h-10 min-w-10 lg:h-8 lg:w-8 lg:min-h-8 lg:min-w-8 items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90"
                          aria-label={translate(
                            "unitsFilter.favoriteSearches.rename",
                            "Rename"
                          )}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                          className="inline-flex h-10 w-10 min-h-10 min-w-10 lg:h-8 lg:w-8 lg:min-h-8 lg:min-w-8 items-center justify-center rounded-md border border-[#E6E6E6] text-gray-600 hover:bg-gray-50"
                          aria-label={translate("buttons.cancel", "Cancel")}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : isDeleting ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-700">
                          {translate(
                            "unitsFilter.favoriteSearches.deleteConfirm",
                            "Delete this favorite?"
                          )}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDelete(favorite.id)}
                            className="h-10 min-h-10 lg:h-7 lg:min-h-7 rounded-md bg-red-600 px-3 lg:px-2 text-xs lg:text-[11px] font-medium text-white hover:bg-red-700"
                          >
                            {translate("buttons.delete", "Delete")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="h-10 min-h-10 lg:h-7 lg:min-h-7 rounded-md border border-[#E6E6E6] px-3 lg:px-2 text-xs lg:text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                          >
                            {translate("buttons.cancel", "Cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => onApply(favorite.filters)}
                          className="min-w-0 flex-1 text-start rounded-md px-1 py-0.5 hover:bg-[#F6F7FB] transition-colors"
                        >
                          <p className="truncate text-xs font-medium text-[#494A4B]">
                            {favorite.name}
                          </p>
                          <p className="truncate text-[11px] text-gray-500">
                            {summary}
                          </p>
                          {savedDate && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {translate(
                                "unitsFilter.favoriteSearches.savedOn",
                                "Saved {date}"
                              ).replace("{date}", savedDate)}
                            </p>
                          )}
                        </button>

                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(favorite.id);
                              setEditingName(favorite.name);
                              setDeleteConfirmId(null);
                            }}
                            className="inline-flex h-10 w-10 min-h-10 min-w-10 lg:h-7 lg:w-7 lg:min-h-7 lg:min-w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            aria-label={translate(
                              "unitsFilter.favoriteSearches.rename",
                              "Rename"
                            )}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteConfirmId(favorite.id);
                              setEditingId(null);
                            }}
                            className="inline-flex h-10 w-10 min-h-10 min-w-10 lg:h-7 lg:w-7 lg:min-h-7 lg:min-w-7 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600"
                            aria-label={translate("buttons.delete", "Delete")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
