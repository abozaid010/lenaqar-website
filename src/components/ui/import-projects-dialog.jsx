"use client";

import ImportDialog from "@/components/ui/import-dialog";
import { useI18n } from "@/context/translate-api";
import { useCompounds } from "@/hooks/use-admin-shared-data";
import { importProjects } from "@/utils/api";

export default function ImportProjectsDialog({
  isOpen,
  onClose,
  clientId, // Kept for backward compatibility but no longer required
  onImported,
  existingProjectIds = [],
}) {
  const { t, locale } = useI18n();

  const {
    data: allProjects,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCompounds(null, true);

  const handleImport = async (selectedIds) => {
    // Map selected IDs to full project objects matching API format
    // Send complete project objects as shown in curl example
    const selectedProjects = allProjects
      ?.filter((project) => selectedIds.includes(project.id))
      .map((project) => ({
        id: project.id,
        ar_name: project.ar_name,
        en_name: project.en_name,
        description: project.description || "",
        google_map_link: project.google_map_link || "",
        video_url: project.video_url || "",
        gated: project.gated ?? false,
        developer_name: project.developer_name || "",
        developer_id: project.developer_id || "",
        images: project.images || [],
        client_id: project.client_id || "public",
        city: project.city || "",
        district: project.district || "",
        country: project.country || "Egypt",
        area: project.area || 0,
        units_count: project.units_count || 0,
        master_plan: project.master_plan || null,
        payment_plans: project.payment_plans || [],
        phases: project.phases || [],
        properties_types: project.properties_types || [],
        updated_at: project.updated_at || null,
      })) || [];

    if (selectedProjects.length === 0) {
      throw new Error(
        t.projectPage?.importError ||
          "Failed to import projects. Please try again."
      );
    }

    const res = await importProjects(selectedProjects);

    if (!res || !res.status) {
      throw new Error(
        res?.error ||
          res?.error_message ||
          t.projectPage?.importError ||
          "Failed to import projects. Please try again."
      );
    }

    onImported && (await onImported());
  };

  const renderProject = (project, isSelected, isDisabled, toggleSelection) => {
    const isAlreadyImported = existingProjectIds?.includes(project.id);

    return (
      <label
        key={project.id}
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
              {locale === "ar" ? project.ar_name : project.en_name}
            </h3>
            {isAlreadyImported && (
              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                {t.projectPage?.alreadyImported || "Already imported"}
              </span>
            )}
          </div>
          {(locale === "ar" ? project.ar_description : project.description) && (
            <p className="mt-1 text-xs sm:text-sm text-gray-700 whitespace-pre-line break-words">
              {locale === "ar" ? project.ar_description : project.description}
            </p>
          )}
        </div>
      </label>
    );
  };

  const config = {
    title: t.projectPage?.importProjects || "Import projects",
    searchPlaceholder:
      t.projectPage?.searchImportPlaceholder ||
      "Search in all projects...",
    selectedLabel: t.projectPage?.selectedCountLabel || "Selected",
    selectAll: t.projectPage?.selectAll || "Select all",
    deselectAll: t.projectPage?.deselectAll || "Deselect all",
    clearSelection: t.projectPage?.clearSelection || "Clear selection",
    showOnlyMissingLabel:
      t.projectPage?.showOnlyMissingProjects ||
      "Show only missing projects",
    available: t.projectPage?.available || "available",
    total: t.projectPage?.total || "total",
    ofTotal: t.projectPage?.ofTotal || "of",
    alreadyImported: t.projectPage?.alreadyImported || "Already imported",
    cancelButton: t.cancelButton || "Cancel",
    importButton:
      t.projectPage?.importSelected || "Import selected projects",
    noItemsSelected:
      t.projectPage?.noProjectsSelected ||
      "Please select at least one project to import.",
    importError:
      t.projectPage?.importError ||
      "Failed to import projects. Please try again.",
    missingClient:
      t.projectPage?.missingClient ||
      "Missing client information. Please reload the page.",
    loadError:
      t.projectPage?.importLoadError || "Failed to load projects list.",
    retryLabel: t.projectPage?.retryLabel || "Retry",
    noItemsMatchSearch:
      t.projectPage?.noProjectsMatchSearch ||
      "No projects match your search.",
    noItemsAvailable:
      t.projectPage?.noProjectsToImport ||
      "No projects available to import.",
  };

  return (
    <ImportDialog
      isOpen={isOpen}
      onClose={onClose}
      onImport={handleImport}
      items={allProjects}
      existingItemIds={existingProjectIds}
      renderItem={renderProject}
      searchFields={["ar_name", "en_name", "description", "ar_description"]}
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

