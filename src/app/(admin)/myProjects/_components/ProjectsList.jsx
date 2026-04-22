"use client";

import { useI18n } from "@/context/translate-api";
import { useProjectsPaginated, useDevelopers } from "@/hooks/use-admin-shared-data";
import CityManager from "@/utils/city_manager";
import {
  CreditCard,
  Home,
  Plus,
  ChevronDown,
  Layers,
  MapPin,
  Building2,
} from "lucide-react";
import { EditButton, DeleteButton } from "@/components/ui/action-button";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";

import AddCompoundDialog from "@/components/ui/add-project-dialog";
import PhasesManagerDialog from "@/components/ui/phases-manager-dialog";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import ImageWithLoader from "@/components/ui/image-with-loader";
import ImportProjectsDialog from "@/components/ui/import-projects-dialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ReusableSearchInput from "@/components/ui/reusable-search-input";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import SearchableProjectSelect from "@/components/ui/inputs/searchable-project-select";
import { getBuildingTypes } from "@/data/constants";
import en from "../../../../../public/locales/en";
import ar from "../../../../../public/locales/ar";
import { deleteProject } from "@/utils/api";
import { paginatedProjectKeys } from "@/utils/query-utils";
import { useQueryClient } from "@tanstack/react-query";
import { filterBySearchQuery } from "@/utils/search-utils";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import EmptyStateVideo from "@/components/ui/empty-state-video";
import QueryErrorState from "@/components/ui/query-error-state";
import OwnerActions from "@/components/ui/owner-actions";
import { useBrokerPermission } from "@/hooks/useBrokerPermission";
import { useModuleActions } from "@/hooks/useModuleActions";

const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : "");

const getPropertyTypeLabel = (value, locale, buildingTypes) => {
  const type = buildingTypes.find((t) => t.value === value);
  return type ? (locale === "ar" ? type.ar_label : type.en_label) : value;
};

const formatPaymentPlan = (plan) => {
  if (typeof plan === "string") return plan;
  if (plan && typeof plan === "object") return plan.name;
  return "";
};

function Chip({ children, variant = "default", title }) {
  const styles = {
    default: "bg-gray-100 text-gray-700 border border-gray-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    green: "bg-green-50 text-green-700 border border-green-200",
    purple: "bg-[#E2DBFF] text-primary border border-primary/30",
    amber: "bg-amber-50 text-amber-800 border border-amber-200",
  };
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

function ProjectCard({
  project,
  locale,
  t,
  buildingTypes,
  getCityLabel,
  getDistrictLabel,
  onView,
  onEdit,
  onDelete,
  onManagePhases,
}) {
  const name =
    (locale === "ar"
      ? project?.ar_name ?? project?.en_name
      : project?.en_name ?? project?.ar_name) ?? "";

  const thumb =
    getDisplayImageUrl(project.master_plan?.url) ||
    getDisplayImageUrl(project.images?.[0]?.url) ||
    "/images/defaultImage.jpg";

  const types = project.properties_types || [];
  const plans = project.payment_plans || [];
  const phasesCount = Array.isArray(project.phases) ? project.phases.length : 0;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onView(project);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onView(project)}
      onKeyDown={handleKeyDown}
      aria-label={name}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
        <ImageWithLoader
          src={thumb}
          alt={name || "Project image"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          priority={false}
          loadingVariant="minimal"
        />

        {project.is_active === false && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[11px] font-semibold text-white shadow">
            {locale === "ar" ? "نفذت الكمية" : "Sold Out"}
          </span>
        )}

        <OwnerActions item={project}>
          <div
            className="absolute top-2 right-2 flex gap-1.5 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100 group-focus-within:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <EditButton
              size="sm"
              className="shadow-sm"
              title={t.buttons?.edit || "Edit"}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
            />
            <DeleteButton
              size="sm"
              className="shadow-sm"
              title={t.buttons?.delete || "Delete"}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
            />
          </div>
        </OwnerActions>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <header className="min-w-0">
          <h3 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
            {name}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} className="text-primary" />
              {getCityLabel(project.city)}
            </span>
            {project.district && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={12} className="text-primary" />
                {getDistrictLabel(project.district, project.city)}
              </span>
            )}
            {project.developer_name && (
              <span className="inline-flex items-center gap-1 truncate">
                · {project.developer_name}
              </span>
            )}
          </div>
        </header>

        {types.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Home size={14} className="text-blue-600 shrink-0" />
            {types.slice(0, 3).map((type, i) => (
              <Chip key={i} variant="blue">
                {getPropertyTypeLabel(type, locale, buildingTypes)}
              </Chip>
            ))}
            {types.length > 3 && (
              <Chip variant="default">+{types.length - 3}</Chip>
            )}
          </div>
        )}

        {plans.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <CreditCard size={14} className="text-green-600 shrink-0" />
            {plans.slice(0, 2).map((plan, i) => (
              <Chip
                key={i}
                variant={plan.is_default ? "purple" : "green"}
                title={formatPaymentPlan(plan)}
              >
                <span className="max-w-[160px] truncate">{formatPaymentPlan(plan)}</span>
                {plan.is_default && (
                  <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">
                    • {locale === "ar" ? "افتراضي" : "Default"}
                  </span>
                )}
              </Chip>
            ))}
            {plans.length > 2 && <Chip variant="default">+{plans.length - 2}</Chip>}
          </div>
        )}

        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-3 text-xs text-gray-600">
            {project.area && (
              <span className="inline-flex items-center gap-1">
                <span className="font-semibold text-gray-900">{project.area}</span>
                <span>{t.formLabels?.area || "fdan"}</span>
              </span>
            )}
            {project.delivery_date !== undefined &&
              project.delivery_date !== null &&
              project.delivery_date !== "" &&
              !isNaN(Number(project.delivery_date)) && (
                <span className="inline-flex items-center gap-1">
                  <span className="font-semibold text-gray-900">
                    {Number(project.delivery_date)}
                  </span>
                  <span>{locale === "ar" ? "سنوات" : "yrs"}</span>
                </span>
              )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onManagePhases(project);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:border-primary hover:text-primary"
            >
              <Layers size={14} />
              <span>{t.phases || (locale === "ar" ? "المراحل" : "Phases")}</span>
              <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
                {phasesCount}
              </span>
            </button>
            
            <a
              href={`/myProjects/${project.en_name}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white transition hover:bg-primary/90"
            >
              <span>{locale === "ar" ? "التفاصيل" : "View Details"}</span>
            </a>
          </div>
        </footer>
      </div>
    </article>
  );
}

export default function ProjectsList({ clientId }) {
  const queryClient = useQueryClient();
  const { t, locale } = useI18n();
  const { isDeveloper } = useBrokerPermission();
  const { canCreate: canCreateProject, has: hasProjectAction } =
    useModuleActions("projects");
  const canImportProjects = hasProjectAction("import");

  const [selectedCities, setSelectedCities] = useState([]);
  const [isCityFilterOpen, setIsCityFilterOpen] = useState(false);

  const [translations, setTranslations] = useState({
    cities: [],
    cityLabels: {},
    districtLabels: {},
    isLoading: true,
  });

  const cityEnName = useMemo(() => {
    if (
      selectedCities.length === 1 &&
      selectedCities.length < translations.cities.length
    ) {
      return selectedCities[0];
    }
    return undefined;
  }, [selectedCities, translations.cities.length]);

  const {
    data: developersData,
    isLoading: developersLoading,
  } = useDevelopers(null, true);

  const developers = developersData || [];
  const [selectedDeveloper, setSelectedDeveloper] = useState("");

  const {
    data: paginatedData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProjectsPaginated({
    cityEnName,
    developerId: selectedDeveloper || undefined,
  });

  const projectsList = useMemo(() => {
    if (!paginatedData?.pages) return [];
    return paginatedData.pages.flatMap((page) => page.projects || []);
  }, [paginatedData]);

  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);

  const [projectList, setProjectList] = useState([]);

  // Dialogs state
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState("add"); // "add" | "edit" | "view"
  const [dialogProject, setDialogProject] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showPhasesManager, setShowPhasesManager] = useState(false);
  const [phasesProject, setPhasesProject] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [appendedProjects, setAppendedProjects] = useState([]);
  const [addProjectSelectValue, setAddProjectSelectValue] = useState("");
  const [pendingProject, setPendingProject] = useState(null);

  useEffect(() => {
    const loadAllTranslations = async () => {
      try {
        const manager = CityManager.getInstance();
        await manager.initializeData();

        const allCities = await manager.getCities();
        const citiesData = allCities.map((city) => city.value);

        const cityLabels = {};
        for (const cityObj of allCities) {
          cityLabels[cityObj.value] = await manager.getCityLabel(cityObj.id, locale);
        }

        const districtLabels = {};
        if (projectsList && Array.isArray(projectsList) && projectsList.length > 0) {
          const cityDistrictPairs = new Set();
          projectsList.forEach((project) => {
            if (project.city && project.district) {
              const cityKey = String(project.city).toLowerCase().trim();
              const districtKey = String(project.district).toLowerCase().trim();
              cityDistrictPairs.add(`${cityKey}|${districtKey}`);
            }
          });

          for (const pair of cityDistrictPairs) {
            const [cityValue, districtValue] = pair.split("|");
            const cityObj = await manager.getCityByValue(cityValue);
            if (cityObj) {
              let label = await manager.getDistrictLabel(
                districtValue,
                cityObj.id,
                locale
              );
              if (!label) {
                const districts = await manager.getDistrictsForCity(cityObj.id);
                const districtObj = districts.find(
                  (d) =>
                    d.value === districtValue ||
                    d.en_name.toLowerCase() === districtValue ||
                    d.ar_name === districtValue
                );
                if (districtObj) {
                  label =
                    locale === "ar" ? districtObj.label_ar : districtObj.label_en;
                }
              }
              if (label) districtLabels[pair] = label;
            }
          }
        }

        setTranslations({
          cities: citiesData,
          cityLabels,
          districtLabels,
          isLoading: false,
        });
      } catch (err) {
        console.error("Failed to load translations:", err);
        setTranslations({
          cities: [],
          cityLabels: {},
          districtLabels: {},
          isLoading: false,
        });
      }
    };

    loadAllTranslations();
  }, [locale, projectsList]);

  useEffect(() => {
    if (translations.cities.length > 0 && selectedCities.length === 0) {
      setSelectedCities([...translations.cities]);
    }
  }, [translations.cities, selectedCities.length]);

  const getCityDisplayName = useMemo(() => {
    return (city) => {
      if (!city) return "";
      if (translations.cityLabels[city]) {
        return translations.cityLabels[city];
      }
      const manager = CityManager.getInstance();
      if (manager.isInitialized && manager.cities.length > 0) {
        const cityObj = manager.cities.find((c) => c.value === city);
        if (cityObj) {
          return locale === "ar" ? cityObj.label_ar : cityObj.label_en;
        }
      }
      return capitalize(city);
    };
  }, [translations.cityLabels, locale]);

  const getDistrictDisplayName = useCallback(
    (district, city) => {
      if (!district) return "";
      if (!city) return capitalize(district);

      const cityKey = String(city).toLowerCase().trim();
      const districtKey = String(district).toLowerCase().trim();
      const key = `${cityKey}|${districtKey}`;

      if (translations.districtLabels[key]) {
        return translations.districtLabels[key];
      }

      const manager = CityManager.getInstance();
      if (
        manager.isInitialized &&
        manager.cities.length > 0 &&
        manager.districts.length > 0
      ) {
        const cityObj = manager.cities.find(
          (c) => c.value === cityKey || c.id.toLowerCase() === cityKey
        );
        if (cityObj) {
          const districtObj = manager.districts.find(
            (d) =>
              d.city_id === cityObj.id &&
              (d.value === districtKey ||
                d.en_name.toLowerCase() === districtKey ||
                d.ar_name === district)
          );
          if (districtObj) {
            return locale === "ar" ? districtObj.label_ar : districtObj.label_en;
          }
        }
      }

      return capitalize(district);
    },
    [translations.districtLabels, locale]
  );

  useEffect(() => {
    if (!isLoading && !isError && projectsList) {
      if (!Array.isArray(projectsList)) return;

      const sorted = [...projectsList].sort((a, b) => {
        const rawA =
          (locale === "ar" ? a?.ar_name : a?.en_name) ??
          (locale === "ar" ? a?.en_name : a?.ar_name) ??
          "";
        const rawB =
          (locale === "ar" ? b?.ar_name : b?.en_name) ??
          (locale === "ar" ? b?.en_name : b?.ar_name) ??
          "";
        return String(rawA)
          .trim()
          .localeCompare(String(rawB).trim(), locale, { sensitivity: "base" });
      });

      let cityFiltered = sorted;
      if (
        selectedCities.length > 1 &&
        selectedCities.length < translations.cities.length
      ) {
        cityFiltered = sorted.filter((p) => {
          const projectCity = p.city?.toLowerCase() || "";
          return selectedCities.some((c) => c.toLowerCase() === projectCity);
        });
      }

      const filtered = searchQuery
        ? filterBySearchQuery(cityFiltered, searchQuery, ["ar_name", "en_name"])
        : cityFiltered;

      setProjectList(filtered);
    }
  }, [
    isLoading,
    isError,
    projectsList,
    locale,
    searchQuery,
    selectedCities,
    translations.cities,
  ]);

  const displayList = useMemo(() => {
    const appendedIds = new Set(appendedProjects.map((p) => p.id));
    const rest = projectList.filter((p) => !appendedIds.has(p.id));
    const restSorted = [...rest].sort((a, b) => {
      const rawA =
        (locale === "ar" ? a?.ar_name : a?.en_name) ??
        (locale === "ar" ? a?.en_name : a?.ar_name) ??
        "";
      const rawB =
        (locale === "ar" ? b?.ar_name : b?.en_name) ??
        (locale === "ar" ? b?.en_name : b?.ar_name) ??
        "";
      return String(rawA)
        .trim()
        .localeCompare(String(rawB).trim(), locale, { sensitivity: "base" });
    });
    const merged = [...appendedProjects, ...restSorted];
    if (pendingProject) {
      return [
        pendingProject,
        ...merged.filter((p) => p.id !== pendingProject.id),
      ];
    }
    return merged;
  }, [projectList, appendedProjects, pendingProject, locale]);

  const handleProjectSelectStart = useCallback((option) => {
    setPendingProject({
      id: option.id,
      en_name: option.en_name,
      ar_name: option.ar_name,
      _pending: true,
    });
  }, []);

  const handleAppendProject = useCallback((fullProject) => {
    setPendingProject(null);
    if (!fullProject?.id) return;
    setAppendedProjects((prev) => [
      fullProject,
      ...prev.filter((p) => p.id !== fullProject.id),
    ]);
    setAddProjectSelectValue("");
  }, []);

  // Add/Edit handlers — unchanged logic
  const handleProjectSaved = (data) => {
    setAppendedProjects((prev) =>
      prev.some((p) => p.id === data.id)
        ? prev.map((p) => (p.id === data.id ? data : p))
        : prev
    );
    setProjectList((prev) => {
      const exists = prev.some((p) => p.id === data.id);
      return exists
        ? prev.map((p) => (p.id === data.id ? data : p))
        : [...prev, data];
    });
    queryClient.invalidateQueries({ queryKey: paginatedProjectKeys.all });
  };

  const handleOpenView = (project) => {
    setDialogProject(project);
    setProjectDialogMode("view");
    setShowProjectDialog(true);
  };
  const handleOpenEdit = (project) => {
    setDialogProject(project);
    setProjectDialogMode("edit");
    setShowProjectDialog(true);
  };
  const handleOpenAdd = () => {
    setDialogProject(null);
    setProjectDialogMode("add");
    setShowProjectDialog(true);
  };
  const handleOpenPhases = (project) => {
    setPhasesProject(project);
    setShowPhasesManager(true);
  };

  const handlePhasesProjectUpdate = (updatedProject) => {
    setPhasesProject(updatedProject);
    handleProjectSaved(updatedProject);
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      const res = await deleteProject(projectToDelete.id);
      if (res.code === 409) {
        toast.error(t.associateProject);
      } else if (res.code === 200) {
        toast.success(t.projectDelete);
        setAppendedProjects((prev) =>
          prev.filter((p) => p.id !== projectToDelete.id)
        );
        setProjectList((prev) => prev.filter((p) => p.id !== projectToDelete.id));
        queryClient.invalidateQueries({ queryKey: paginatedProjectKeys.all });
      }
    } catch {
      toast.error(t.failedProject);
    } finally {
      setShowDeleteDialog(false);
      setProjectToDelete(null);
    }
  };

  const handleImported = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: paginatedProjectKeys.all });
      toast.success(
        t.projectPage?.importSuccess || "Projects imported successfully."
      );
      setSearchQuery("");
    } catch (err) {
      console.error("Error refetching projects after import:", err);
      toast.error(
        t.projectPage?.importRefetchError || "Failed to refresh projects list."
      );
    }
  };

  // City filter handlers
  const cityFilterRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        cityFilterRef.current &&
        !cityFilterRef.current.contains(event.target)
      ) {
        setIsCityFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCityToggle = (city) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const handleSelectAllCities = () => {
    if (selectedCities.length === translations.cities.length) {
      setSelectedCities([]);
    } else {
      setSelectedCities([...translations.cities]);
    }
  };

  const getCityFilterDisplayText = () => {
    if (
      selectedCities.length === 0 ||
      selectedCities.length === translations.cities.length
    ) {
      return locale === "ar" ? "جميع المدن" : "All Cities";
    }
    if (selectedCities.length === 1) {
      return getCityDisplayName(selectedCities[0]);
    }
    return locale === "ar"
      ? `${selectedCities.length} مدن`
      : `${selectedCities.length} Cities`;
  };

  return (
    <>
      {showProjectDialog && (
        <AddCompoundDialog
          isOpen={showProjectDialog}
          onClose={() => {
            setShowProjectDialog(false);
            setDialogProject(null);
          }}
          compoundData={dialogProject}
          viewMode={projectDialogMode === "view"}
          onAdd={handleProjectSaved}
          clientId={clientId}
        />
      )}

      {projectToDelete && (
        <DeleteConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setProjectToDelete(null);
          }}
          confirmLabel={t.deleteButton}
          cancelLabel={t.cancelButton}
          onConfirm={handleConfirmDeleteProject}
          title={t.deleteProjectTitel}
          message={`${t.sureDelet} "${projectToDelete?.name || (locale === "ar" ? projectToDelete?.ar_name : projectToDelete?.en_name) || ""}"? ${t.actionDelet}`}
        />
      )}

      {showPhasesManager && (
        <PhasesManagerDialog
          isOpen={showPhasesManager}
          onClose={() => {
            setShowPhasesManager(false);
            setPhasesProject(null);
          }}
          project={phasesProject}
          canEdit={canCreateProject}
          onProjectUpdate={handlePhasesProjectUpdate}
        />
      )}

      <div className="bg-gray-50 flex flex-col gap-4 p-3 sm:p-4 relative flex-1 min-h-0 h-full w-full">
        {/* Header */}
        <div className="bg-primary rounded-lg shadow-sm px-3 py-3 sm:px-4 sm:py-3 flex flex-col gap-3">
          {/* Top row: title + primary actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-white text-lg sm:text-xl font-semibold leading-none whitespace-nowrap">
              {t.sidebar.myProjects}
            </h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              {canCreateProject && (
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1.5 bg-white text-primary px-3 h-10 rounded-lg transition-colors duration-200 hover:bg-gray-50 text-sm font-medium"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">
                    {t.projectPage?.add || t.addNewProject || "Add"}
                  </span>
                </button>
              )}
              {!isDeveloper && canImportProjects && (
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-white/95 text-primary px-3 h-10 rounded-lg transition-colors duration-200 hover:bg-white text-sm font-medium"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">
                    {t.projectPage?.importButton || "Import"}
                  </span>
                </button>
              )}
              <VideoInstructionsDialog
                variant="projects"
                iconSize="lg"
                iconClassName="hover:bg-white/20 flex items-center justify-center h-10 w-10"
                svgClassName="text-white"
                tooltipText={
                  t.projectsPage?.instructions || "How to manage projects"
                }
              />
            </div>
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px] sm:min-w-[240px] sm:max-w-xs">
              <ReusableSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={
                  t.projectPage?.searchPlaceholder || "Search projects..."
                }
                variant="white"
                className="w-full"
              />
            </div>

            {translations.cities.length > 0 && (
              <div className="relative flex-shrink-0" ref={cityFilterRef}>
                <button
                  type="button"
                  onClick={() => setIsCityFilterOpen(!isCityFilterOpen)}
                  className="flex items-center gap-2 bg-white text-primary px-3 rounded-lg transition-colors duration-200 hover:bg-gray-50 min-w-[140px] h-10 justify-between"
                >
                  <span className="text-sm font-medium truncate">
                    {getCityFilterDisplayText()}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-primary transition-transform ${
                      isCityFilterOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isCityFilterOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-700">
                          {locale === "ar"
                            ? "تصفية حسب المدينة"
                            : "Filter by City"}
                        </h3>
                        <button
                          onClick={handleSelectAllCities}
                          className="text-xs text-primary hover:underline"
                        >
                          {selectedCities.length ===
                          translations.cities.length
                            ? locale === "ar"
                              ? "إلغاء الكل"
                              : "Clear All"
                            : locale === "ar"
                              ? "تحديد الكل"
                              : "Select All"}
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      {translations.cities.map((city) => {
                        const isSelected = selectedCities.includes(city);
                        return (
                          <label
                            key={city}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCityToggle(city)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700 flex-1">
                              {getCityDisplayName(city)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="w-[170px] flex-shrink-0">
              <SearchableDropdownSelect
                options={developers}
                value={selectedDeveloper}
                onChange={(e) => setSelectedDeveloper(e.target.value)}
                name="developer"
                placeholder={
                  developersLoading
                    ? locale === "ar"
                      ? "جاري التحميل..."
                      : "Loading..."
                    : locale === "ar"
                      ? "جميع المطورين"
                      : "All Developers"
                }
                showAllOption={true}
                allOptionLabel={
                  locale === "ar" ? "جميع المطورين" : "All Developers"
                }
                allOptionValue=""
                getValue={(option) => option.id}
                getLabel={(option, loc) =>
                  loc === "ar"
                    ? option.ar_name || option.en_name
                    : option.en_name || option.ar_name
                }
                searchFields={["ar_name", "en_name"]}
                className="w-full"
                buttonClassName="rounded-lg border-0 px-3 h-10 bg-white text-primary hover:bg-gray-50 focus:ring-0 focus:border-0 disabled:bg-gray-50 disabled:text-gray-400 disabled:opacity-60 transition-colors duration-200"
                disabled={developersLoading}
                isLoading={developersLoading}
              />
            </div>

            <div className="w-[190px] flex-shrink-0">
              <SearchableProjectSelect
                value={addProjectSelectValue}
                onChange={(e) => setAddProjectSelectValue(e.target.value)}
                onProjectSelectStart={handleProjectSelectStart}
                onProjectSelect={handleAppendProject}
                name="add_project"
                placeholder={
                  locale === "ar" ? "ابحث بالاسم..." : "Search by name..."
                }
                className="w-full"
                buttonClassName="rounded-lg border-0 px-3 h-10 bg-white text-primary hover:bg-gray-50 focus:ring-0 focus:border-0 disabled:bg-gray-50 disabled:text-gray-400 disabled:opacity-60 transition-colors duration-200"
                isPublic={false}
              />
            </div>
          </div>
        </div>

        {/* Projects content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center w-full h-full min-h-[300px]">
              <LoadingSpinner />
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center w-full h-full min-h-[300px]">
              <QueryErrorState
                error={error}
                refetch={refetch}
                isFetching={isFetching}
                title={t.projectsPage?.errorTitle || "Error loading projects"}
                message={
                  t.projectsPage?.errorMessage ||
                  "Failed to load projects. Please try again."
                }
                retryLabel={t.projectsPage?.retryLabel || "Retry"}
              />
            </div>
          ) : displayList.length === 0 ? (
            <div className="flex items-center justify-center w-full h-full min-h-[300px]">
              <EmptyStateVideo variant="projects" autoPlay showControls loop />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {displayList.map((project) =>
                  project._pending ? (
                    <div
                      key={project.id}
                      className="flex items-center gap-3 rounded-xl border border-primary/40 bg-[#E2DBFF20] p-4"
                    >
                      <LoadingSpinner containerClassName="flex-shrink-0" size={24} />
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-primary">
                          {(locale === "ar"
                            ? project?.ar_name ?? project?.en_name
                            : project?.en_name ?? project?.ar_name) ?? ""}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {locale === "ar" ? "جاري التحميل..." : "Loading..."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      locale={locale}
                      t={t}
                      buildingTypes={BUILDING_TYPES}
                      getCityLabel={getCityDisplayName}
                      getDistrictLabel={getDistrictDisplayName}
                      onView={handleOpenView}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteClick}
                      onManagePhases={handleOpenPhases}
                    />
                  )
                )}
              </div>

              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 font-medium transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isFetchingNextPage ? (
                    <>
                      <LoadingSpinner containerClassName="inline-flex" size={20} />
                      <span>
                        {locale === "ar" ? "جاري التحميل..." : "Loading..."}
                      </span>
                    </>
                  ) : (
                    <span>
                      {locale === "ar" ? "تحميل المزيد" : "Load More"}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ImportProjectsDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        clientId={clientId}
        onImported={handleImported}
        existingProjectIds={displayList.map((p) => p.id)}
      />
    </>
  );
}
