"use client";

import ImportDialog from "@/components/ui/import-dialog";
import { useI18n } from "@/context/translate-api";
import { useDevelopers } from "@/hooks/use-admin-shared-data";
import { importDevelopers } from "@/utils/api";
import toast from "react-hot-toast";

export default function ImportDevelopersDialog({
  isOpen,
  onClose,
  clientId, // Kept for backward compatibility but no longer required
  onImported,
  existingDeveloperIds = [],
}) {
  const { t, locale } = useI18n();

  const {
    data: allDevelopers,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useDevelopers(null, true);

  const handleImport = async (selectedIds) => {
    // Map selected IDs to full developer objects
    const selectedDevelopers = allDevelopers
      ?.filter((dev) => selectedIds.includes(dev.id))
      .map((dev) => ({
        id: dev.id,
        ar_name: dev.ar_name,
        en_name: dev.en_name,
        description: dev.description || "",
        logo: dev.logo || "",
        client_id: dev.client_id || "public",
      })) || [];

    if (selectedDevelopers.length === 0) {
      throw new Error(
        t.developerPage?.importError ||
          "Failed to import developers. Please try again."
      );
    }

    const res = await importDevelopers(selectedDevelopers);

    if (!res || !res.status) {
      throw new Error(
        res?.error ||
          res?.error_message ||
          t.developerPage?.importError ||
          "Failed to import developers. Please try again."
      );
    }

    onImported && (await onImported());
  };

  const renderDeveloper = (dev, isSelected, isDisabled, toggleSelection) => {
    const isAlreadyImported = existingDeveloperIds?.includes(dev.id);

    return (
      <label
        key={dev.id}
        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
          isDisabled
            ? "border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed"
            : isSelected
            ? "border-primary bg-primary/5 cursor-pointer"
            : "border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={toggleSelection}
          disabled={isDisabled}
          className="mt-1 h-4 w-4 text-primary border-gray-300 rounded disabled:cursor-not-allowed"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3
              className="font-semibold text-sm sm:text-base"
              style={{ color: isDisabled ? "#9CA3AF" : "#030250" }}
            >
              {locale === "ar" ? dev.ar_name : dev.en_name}
            </h3>
            {isAlreadyImported && (
              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                {t.developerPage?.alreadyImported || "Already imported"}
              </span>
            )}
          </div>
          {dev.description && (
            <p className="mt-1 text-xs sm:text-sm text-gray-700 whitespace-pre-line break-words">
              {dev.description}
            </p>
          )}
        </div>
      </label>
    );
  };

  const config = {
    title: t.developerPage?.importDevelopers || "Import developers",
    searchPlaceholder:
      t.developerPage?.searchImportPlaceholder ||
      "Search in all developers...",
    selectedLabel: t.developerPage?.selectedCountLabel || "Selected",
    selectAll: t.developerPage?.selectAll || "Select all",
    deselectAll: t.developerPage?.deselectAll || "Deselect all",
    clearSelection: t.developerPage?.clearSelection || "Clear selection",
    showOnlyMissingLabel:
      t.developerPage?.showOnlyMissingDevelopers ||
      "Show only missing developers",
    available: t.developerPage?.available || "available",
    total: t.developerPage?.total || "total",
    ofTotal: t.developerPage?.ofTotal || "of",
    alreadyImported: t.developerPage?.alreadyImported || "Already imported",
    cancelButton: t.cancelButton || "Cancel",
    importButton:
      t.developerPage?.importSelected || "Import selected developers",
    noItemsSelected:
      t.developerPage?.noDevelopersSelected ||
      "Please select at least one developer to import.",
    importError:
      t.developerPage?.importError ||
      "Failed to import developers. Please try again.",
    missingClient:
      t.developerPage?.missingClient ||
      "Missing client information. Please reload the page.",
    loadError:
      t.developerPage?.importLoadError || "Failed to load developers list.",
    retryLabel: t.developerPage?.retryLabel || "Retry",
    noItemsMatchSearch:
      t.developerPage?.noDevelopersMatchSearch ||
      "No developers match your search.",
    noItemsAvailable:
      t.developerPage?.noDevelopersToImport ||
      "No developers available to import.",
  };

  return (
    <ImportDialog
      isOpen={isOpen}
      onClose={onClose}
      onImport={handleImport}
      items={allDevelopers}
      existingItemIds={existingDeveloperIds}
      renderItem={renderDeveloper}
      searchFields={["ar_name", "en_name", "description"]}
      config={config}
      isLoading={isLoading}
      isError={isError}
      error={error}
      refetch={refetch}
      isFetching={isFetching}
      clientId={clientId}
    />
  );
}


