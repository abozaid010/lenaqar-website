"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import ReusableSearchInput from "@/components/ui/reusable-search-input";
import { useI18n } from "@/hooks/useI18n";
import { filterBySearchQuery } from "@/utils/search-utils";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

/**
 * Generic Import Dialog Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Callback when dialog is closed
 * @param {Function} props.onImport - Callback when import is triggered (receives selectedIds array)
 * @param {Array} props.items - Array of items to import
 * @param {Array} props.existingItemIds - Array of IDs that are already imported
 * @param {Function} props.renderItem - Function to render each item: (item, isSelected, isDisabled, toggleSelection) => ReactNode
 * @param {Array} props.searchFields - Fields to search in (e.g., ["ar_name", "en_name", "description"])
 * @param {Object} props.config - Configuration object with labels and text
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.isError - Error state
 * @param {Error} props.error - Error object
 * @param {Function} props.refetch - Function to refetch data
 * @param {boolean} props.isFetching - Fetching state
 * @param {string} props.clientId - Client ID (optional, for validation)
 */
export default function ImportDialog({
  isOpen,
  onClose,
  onImport,
  items = [],
  existingItemIds = [],
  renderItem,
  searchFields = ["ar_name", "en_name", "description"],
  config = {},
  isLoading = false,
  isError = false,
  error = null,
  refetch = null,
  isFetching = false,
  clientId = null,
}) {
  const { t, locale } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOnlyMissing, setShowOnlyMissing] = useState(true);

  // Default configuration
  const defaultConfig = {
    title: "Import",
    searchPlaceholder: "Search...",
    selectedLabel: "Selected",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    clearSelection: "Clear selection",
    showOnlyMissingLabel: "Show only missing",
    available: "available",
    total: "total",
    ofTotal: "of",
    alreadyImported: "Already imported",
    cancelButton: "Cancel",
    importButton: "Import selected",
    noItemsSelected: "Please select at least one item to import.",
    importError: "Failed to import. Please try again.",
    missingClient: "Missing client information. Please reload the page.",
    loadError: "Failed to load items list.",
    retryLabel: "Retry",
    noItemsMatchSearch: "No items match your search.",
    noItemsAvailable: "No items available to import.",
  };

  const finalConfig = { ...defaultConfig, ...config };

  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];

    // If showing only missing, filter by existing ones
    const itemsToShow = showOnlyMissing
      ? items.filter((item) => !existingItemIds?.includes(item.id))
      : items;

    if (!searchQuery) return itemsToShow;

    return filterBySearchQuery(itemsToShow, searchQuery, searchFields);
  }, [items, existingItemIds, searchQuery, showOnlyMissing, searchFields]);

  // Reset dialog state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIds([]);
      setShowOnlyMissing(true);
    }
  }, [isOpen]);

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      // Select all filtered items that are not already imported
      const importableIds = filteredItems
        .filter((item) => !existingItemIds?.includes(item.id))
        .map((item) => item.id);
      setSelectedIds(importableIds);
    }
  };

  const handleImport = async () => {
    if (clientId === null && finalConfig.missingClient) {
      toast.error(finalConfig.missingClient);
      return;
    }

    if (!selectedIds.length) {
      toast.error(finalConfig.noItemsSelected);
      return;
    }

    setIsSubmitting(true);
    try {
      await onImport(selectedIds);
      onClose && onClose();
    } catch (err) {
      console.error("Failed to import:", err?.message ?? err);
      toast.error(err?.message || finalConfig.importError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const allSelected =
    filteredItems.length > 0 && selectedIds.length === filteredItems.length;
  const isRTL = locale === "ar";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[80%] h-[80%] flex flex-col bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 bg-primary">
          <h2 className="text-lg font-semibold text-white rtl:text-right ltr:text-left whitespace-nowrap">
            {finalConfig.title}
          </h2>

          <div className="flex-1 max-w-lg">
            <ReusableSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={finalConfig.searchPlaceholder}
              variant="white"
              className="w-full"
            />
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/15 transition-colors flex-shrink-0 rtl:mr-auto ltr:ml-auto"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 bg-gray-50 flex flex-col min-h-0">
          <div className="p-4 border-b bg-white flex items-center justify-between gap-3 flex-shrink-0 flex-wrap">
            <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
              <span>
                {finalConfig.selectedLabel}:{" "}
                <span className="font-semibold">{selectedIds.length}</span>
                {items && Array.isArray(items) && showOnlyMissing && (
                  <span className="text-gray-400 ml-2">
                    ({filteredItems.length} / {items.length} {finalConfig.available})
                  </span>
                )}
                {items && Array.isArray(items) && !showOnlyMissing && (
                  <span className="text-gray-400 ml-2">
                    ({filteredItems.length} {finalConfig.total})
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-primary hover:underline disabled:text-gray-400"
                disabled={!filteredItems.length}
              >
                {allSelected ? finalConfig.deselectAll : finalConfig.selectAll}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-primary hover:underline disabled:text-gray-400"
                disabled={!selectedIds.length}
              >
                {finalConfig.clearSelection}
              </button>
            </div>

            {items && Array.isArray(items) && existingItemIds?.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showOnlyMissing}
                  onChange={(e) => setShowOnlyMissing(e.target.checked)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="rtl:text-right ltr:text-left">
                  {finalConfig.showOnlyMissingLabel}
                </span>
              </label>
            )}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading || isFetching ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                <p className="text-sm text-red-600">{finalConfig.loadError}</p>
                {refetch && (
                  <button
                    onClick={() => refetch()}
                    className="px-4 py-1.5 rounded-md bg-primary text-white text-sm hover:bg-primary/90"
                  >
                    {finalConfig.retryLabel}
                  </button>
                )}
                {error?.message && (
                  <p className="text-xs text-gray-500 max-w-md">{error.message}</p>
                )}
              </div>
            ) : !filteredItems.length ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                {searchQuery
                  ? finalConfig.noItemsMatchSearch
                  : finalConfig.noItemsAvailable}
              </div>
            ) : (
              <div className="p-4 space-y-3 max-w-5xl mx-auto w-full">
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isAlreadyImported = existingItemIds?.includes(item.id);
                  const isDisabled = isAlreadyImported && showOnlyMissing;

                  return renderItem
                    ? renderItem(item, isSelected, isDisabled, () =>
                        !isDisabled && toggleSelection(item.id)
                      )
                    : null;
                })}
              </div>
            )}
          </div>

          <div className="border-t bg-white px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 rtl:flex-row-reverse ltr:flex-row rtl:justify-start ltr:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50"
                disabled={isSubmitting}
              >
                {finalConfig.cancelButton}
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isSubmitting || !selectedIds.length}
                className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed hover:bg-primary/90 flex items-center gap-2"
              >
                {isSubmitting && (
                  <span className="inline-block w-4 h-4 border-2 border-white border-b-transparent rounded-full animate-spin" />
                )}
                {finalConfig.importButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

