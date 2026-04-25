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
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import EmptyStateVideo from "@/components/ui/empty-state-video";
import QueryErrorState from "@/components/ui/query-error-state";
import OwnerActions from "@/components/ui/owner-actions";
import { useBrokerPermission } from "@/hooks/useBrokerPermission";
import { useModuleActions } from "@/hooks/useModuleActions";

const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : "");

const getPropertyTypeLabel = (value, translate) => {
  const raw = (value ?? "").toString();
  const key = raw.toLowerCase();
  return translate ? translate(`buildingTypes.${key}`, raw) : raw;
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
                {getPropertyTypeLabel(type, translate)}
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
  const router = useRouter();
  const { t, locale, translate } = useI18n();
  const { isDeveloper } = useBrokerPermission();
  const { canCreate: canCreateProject, has: hasProjectAction } =
    useModuleActions("projects");
  const canImportProjects = hasProjectAction("import");

  
  const [translations, setTranslations] = useState({
    cities: [],
    cityLabels: {},
    districtLabels: {},
    isLoading: true,
  });

  const [selectedCity, setSelectedCity] = useState("");

  const cityEnName = useMemo(() => {
    if (selectedCity && selectedCity !== "" && selectedCity !== "all") {
      return selectedCity;
    }
    return undefined;
  }, [selectedCity]);

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
    if (translations.cities.length > 0 && !selectedCity) {
      setSelectedCity("all");
    }
  }, [translations.cities, selectedCity]);

  const getCityDisplayName = useMemo(() => {
    return (city) => {
      if (!city) return "";
      if (city === "all") return t?.common?.all || "All";
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
  }, [translations.cityLabels, locale, t?.common?.all]);

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
      if (selectedCity && selectedCity !== "" && selectedCity !== "all") {
        cityFiltered = sorted.filter((p) => {
          const projectCity = p.city?.toLowerCase() || "";
          return projectCity === selectedCity.toLowerCase();
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
    selectedCity,
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
    const slug = encodeURIComponent(project.en_name || project.ar_name || project.id);
    router.push(`/${clientId}/myProjects/${slug}`);
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
  // Convert cities to options format for SearchableDropdownSelect
  const cityOptions = useMemo(() => {
    return translations.cities.map(city => ({
      value: city,
      label: getCityDisplayName(city)
    }));
  }, [translations.cities, getCityDisplayName]);

  const getCityFilterDisplayText = () => {
    if (!selectedCity || selectedCity === "all") {
      return t?.unitsFilter?.allCities || (locale === "ar" ? "جميع المدن" : "All Cities");
    }
    return getCityDisplayName(selectedCity);
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
          onEdit={handleOpenEdit}
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

      {/* Header Container */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:justify-between">
          {/* Cities Dropdown */}
          {translations.cities.length > 0 && (
            <div className="w-full md:w-auto md:flex-1 min-w-0">
              <SearchableDropdownSelect
                options={cityOptions}
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                name="city"
                placeholder={locale === "ar" ? "جميع المدن" : "All Cities"}
                showAllOption={true}
                allOptionLabel={locale === "ar" ? "جميع المدن" : "All Cities"}
                allOptionValue=""
                getValue={(option) => option.value}
                getLabel={(option) => option.label}
                className="w-full"
                buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                disabled={translations.isLoading}
                isLoading={translations.isLoading}
              />
            </div>
          )}

          {/* Developer Dropdown */}
          <div className="w-full md:w-auto md:flex-1 min-w-0">
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
              buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              disabled={developersLoading}
              isLoading={developersLoading}
            />
          </div>

          {/* Project Search Dropdown */}
          <div className="w-full md:w-auto md:flex-1 min-w-0">
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
              buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              isPublic={false}
            />
          </div>

          {/* Action buttons */}
          <div className="w-full md:w-auto flex-shrink-0 flex gap-2 items-center">
            {canCreateProject && (
              <button
                onClick={handleOpenAdd}
                className="flex-1 md:flex-initial px-4 py-2 h-10 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
              >
                <Plus size={18} className="shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">
                  {t.projectPage?.add || t.addNewProject || "Add"}
                </span>
              </button>
            )}
            {!isDeveloper && canImportProjects && (
              <button
                onClick={() => setIsImportOpen(true)}
                className="flex-1 md:flex-initial px-4 py-2 h-10 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
              >
                <Plus size={18} className="shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">
                  {t.projectPage?.importButton || "Import"}
                </span>
              </button>
            )}
            <div className="flex items-center justify-center w-10 h-10 bg-[#F6F7FB] border border-[#E6E6E6] rounded-md hover:border-primary/40 transition-colors">
              <VideoInstructionsDialog
                variant="projects"
                iconSize="sm"
                tooltipText={
                  t.projectsPage?.instructions || "How to manage projects"
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Margin Separator */}
      <div className="h-4 bg-gray-100"></div>

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
