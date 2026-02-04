"use client";

import { useI18n } from "@/context/translate-api";
import { useCompounds, useDevelopers } from "@/hooks/use-admin-shared-data";
import CityManager from "@/utils/city_manager";
import { SELECTION_COLORS } from "@/constants/colors";
import {
  Clock,
  CreditCard,
  Home,
  Pencil,
  Plus,
  Tag,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
  Image as ImageIcon,
  ChevronsRight,
} from "lucide-react";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";

import AddCompoundDialog from "@/components/ui/add-compound-dialog";
import AddPhaseDialog from "@/components/ui/add-phase-dialog";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import ImageWithLoader from "@/components/ui/image-with-loader";
import ImageSwiperModal from "@/components/ui/images-swiper-modal";
import LazyVisible from "@/components/ui/lazy-visible";
import ImportProjectsDialog from "@/components/ui/import-projects-dialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ReusableSearchInput from "@/components/ui/reusable-search-input";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { getBuildingTypes } from "@/data/constants";
import en from "../../../../../public/locales/en";
import ar from "../../../../../public/locales/ar";
import { deletePhase, deleteProject } from "@/utils/api";
import { filterBySearchQuery } from "@/utils/search-utils";
import { useEffect, useState, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import "swiper/css";
import "swiper/css/pagination";
import EmptyStateVideo from "@/components/ui/empty-state-video";
import QueryErrorState from "@/components/ui/query-error-state";

// Capitalize function
const capitalize = (str) => str?.charAt(0).toUpperCase() + str?.slice(1);

const getPropertyTypeLabel = (value, locale, buildingTypes) => {
  const type = buildingTypes.find((type) => type.value === value);
  return type ? (locale === "ar" ? type.ar_label : type.en_label) : value;
};

const formatPaymentPlan = (plan, locale) => {
  if (typeof plan === "string") {
    return plan;
  }
  if (plan && typeof plan === "object") {
    return plan.name;
  }
  return "";
};

const PropertyTypesBadges = ({ types, locale, maxDisplay = 3, buildingTypes }) => {
  if (!types || types.length === 0) return null;

  const displayTypes = types.slice(0, maxDisplay);
  const remainingCount = types.length - maxDisplay;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Home size={16} className="text-blue-600" />
      {displayTypes.map((type, index) => (
        <span
          key={index}
          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
        >
          {getPropertyTypeLabel(type, locale, buildingTypes)}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

const PaymentPlansBadges = ({ plans, locale, maxDisplay = 2 }) => {
  if (!plans || plans.length === 0) return null;

  const displayPlans = plans.slice(0, maxDisplay);
  const remainingCount = plans.length - maxDisplay;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <CreditCard size={16} className="text-green-600" />
      {displayPlans.map((plan, index) => (
        <span
          key={index}
          className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
            plan.is_default
              ? "bg-blue-100 text-blue-800 border border-blue-300"
              : "bg-green-100 text-green-800"
          }`}
        >
          {formatPaymentPlan(plan, locale)}
          {plan.is_default && (
            <span className="text-[10px] font-bold">
              {locale === "ar" ? "•" : "•"}
            </span>
          )}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

export default function ProjectsList({ clientId }) {
  const {
    data: compounds,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCompounds(clientId);
  const {
    data: developersData,
    isLoading: developersLoading,
    isError: developersError,
  } = useDevelopers(null, true); // Fetch all public developers
  const { t, locale } = useI18n();

  // Get building types with translations
  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);

  const [showFullScreenSwiper, setShowFullScreenSwiper] = useState(false);
  const [fullScreenImages, setFullScreenImages] = useState([]);
  const [fullScreenMasterPlan, setFullScreenMasterPlan] = useState(null);
  const [buildingTypeImagesModal, setBuildingTypeImagesModal] = useState({
    open: false,
    images: [],
    title: "",
  });

  const [projectList, setProjectList] = useState(compounds || []);
  const [projectImageLoading, setProjectImageLoading] = useState(false);

  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [selectedProject, setSelectedProject] = useState(
    compounds?.[0] || null
  );

  const [showPhaseDialog, setShowPhaseDialog] = useState(false);
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0);
  const [phaseToEdit, setPhaseToEdit] = useState(null);
  const [phaseToDelete, setPhaseToDelete] = useState(null);
  const [phaseImageLoading, setPhaseImageLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  // City filter state
  const [selectedCities, setSelectedCities] = useState([]);
  const [isCityFilterOpen, setIsCityFilterOpen] = useState(false);
  
  // Developer filter state
  const developers = developersData || [];
  const [selectedDeveloper, setSelectedDeveloper] = useState("");

  // Single translations object that holds everything
  const [translations, setTranslations] = useState({
    cities: [],           // Array of city values (lowercase)
    cityLabels: {},      // Map: cityValue -> translated label
    districtLabels: {}, // Map: "cityValue|districtValue" -> translated label
    isLoading: true
  });

  // Load all translations in one go
  useEffect(() => {
    const loadAllTranslations = async () => {
      try {
        const manager = CityManager.getInstance();
        await manager.initializeData();

        // Get all cities from manager
        const allCities = await manager.getCities();
        const citiesData = allCities.map(city => city.value);
        
        // Load city labels
        const cityLabels = {};
        for (const cityObj of allCities) {
          cityLabels[cityObj.value] = await manager.getCityLabel(cityObj.id, locale);
        }

        // Load district labels for all projects
        const districtLabels = {};
        if (compounds && Array.isArray(compounds) && compounds.length > 0) {
          // Get all unique city-district combinations from projects
          const cityDistrictPairs = new Set();
          compounds.forEach(project => {
            if (project.city && project.district) {
              const cityKey = String(project.city).toLowerCase().trim();
              const districtKey = String(project.district).toLowerCase().trim();
              cityDistrictPairs.add(`${cityKey}|${districtKey}`);
            }
          });

          // Load labels for each city-district pair
          for (const pair of cityDistrictPairs) {
            const [cityValue, districtValue] = pair.split('|');
            const cityObj = await manager.getCityByValue(cityValue);
            if (cityObj) {
              // Try multiple ways to find the district
              let label = await manager.getDistrictLabel(districtValue, cityObj.id, locale);
              
              // If not found, try finding by en_name or ar_name
              if (!label) {
                const districts = await manager.getDistrictsForCity(cityObj.id);
                const districtObj = districts.find(d => 
                  d.value === districtValue ||
                  d.en_name.toLowerCase() === districtValue ||
                  d.ar_name === districtValue
                );
                if (districtObj) {
                  label = locale === "ar" ? districtObj.label_ar : districtObj.label_en;
                }
              }
              
              if (label) {
                districtLabels[pair] = label;
              }
            }
          }
        }

        setTranslations({
          cities: citiesData,
          cityLabels,
          districtLabels,
          isLoading: false
        });
      } catch (error) {
        console.error("Failed to load translations:", error);
        setTranslations({
          cities: [],
          cityLabels: {},
          districtLabels: {},
          isLoading: false
        });
      }
    };

    loadAllTranslations();
  }, [locale, compounds]);

  // Initialize selectedCities with all cities when translations load
  useEffect(() => {
    if (translations.cities.length > 0 && selectedCities.length === 0) {
      setSelectedCities([...translations.cities]);
    }
  }, [translations.cities, selectedCities.length]);

  // Helper function to get city label with fallback
  const getCityDisplayName = useMemo(() => {
    return (city) => {
      // First try cityLabels (pre-loaded translations)
      if (translations.cityLabels[city]) {
        return translations.cityLabels[city];
      }
      // Fallback: if CityManager is initialized, try to get label directly
      const manager = CityManager.getInstance();
      if (manager.isInitialized && manager.cities.length > 0) {
        const cityObj = manager.cities.find(c => c.value === city);
        if (cityObj) {
          return locale === "ar" ? cityObj.label_ar : cityObj.label_en;
        }
      }
      // Final fallback
      return capitalize(city);
    };
  }, [translations.cityLabels, locale]);

  useEffect(() => {
    if (!isLoading && !isError && compounds) {
      // Validate that compounds is an array
      if (!Array.isArray(compounds)) {
        console.error("Compounds data is not an array:", compounds);
        return;
      }

      // Sort compounds
      const sorted = [...compounds].sort((a, b) => {
        const rawA =
          (locale === "ar" ? a?.ar_name : a?.en_name) ??
          (locale === "ar" ? a?.en_name : a?.ar_name) ??
          "";
        const rawB =
          (locale === "ar" ? b?.ar_name : b?.en_name) ??
          (locale === "ar" ? b?.en_name : b?.ar_name) ??
          "";

        const nameA = String(rawA).trim();
        const nameB = String(rawB).trim();
        return nameA.localeCompare(nameB, locale, {
          sensitivity: "base",
        });
      });

      // Filter by city if cities are selected
      let cityFiltered = sorted;
      if (selectedCities.length > 0 && selectedCities.length < translations.cities.length) {
        cityFiltered = sorted.filter((project) => {
          const projectCity = project.city?.toLowerCase() || "";
          return selectedCities.some(
            (city) => city.toLowerCase() === projectCity
          );
        });
      }

      // Filter by developer if selected
      let developerFiltered = cityFiltered;
      if (selectedDeveloper && selectedDeveloper !== "") {
        const selectedDev = developers.find((dev) => dev.id === selectedDeveloper);
        if (selectedDev) {
          developerFiltered = cityFiltered.filter((project) => {
            const projectDeveloperName = project.developer_name?.toLowerCase() || "";
            const devArName = selectedDev.ar_name?.toLowerCase() || "";
            const devEnName = selectedDev.en_name?.toLowerCase() || "";
            return (
              projectDeveloperName === devArName ||
              projectDeveloperName === devEnName
            );
          });
        }
      }

      // Filter by search query if provided
      const filtered = searchQuery
        ? filterBySearchQuery(developerFiltered, searchQuery, ["ar_name", "en_name"])
        : developerFiltered;

      setProjectList(filtered);
      
      // Set initial selected project if none is selected
      if (!selectedProject && filtered.length > 0) {
        setSelectedProject(filtered[0]);
      }
    }
  }, [isLoading, isError, compounds, locale, searchQuery, selectedCities, translations.cities, selectedDeveloper, developers]);

  // Update selected project if it's not in the filtered list
  useEffect(() => {
    if (projectList.length > 0 && selectedProject) {
      const isSelectedInList = projectList.some(
        (p) => p.id === selectedProject.id
      );
      if (!isSelectedInList) {
        setSelectedProject(projectList[0]);
      }
    } else if (projectList.length === 0) {
      setSelectedProject(null);
    }
  }, [projectList, selectedProject]);

  // Handle project selection with loading state
  const handleProjectSelection = (project) => {
    if (selectedProject?.id !== project.id) {
      setProjectImageLoading(true);
      setSelectedProject(project);
      // Reset phase selection when changing projects
      setSelectedPhaseIdx(0);
      setPhaseImageLoading(true);
    }
  };

  // Handle phase selection with loading state
  const handlePhaseSelection = (idx) => {
    if (selectedPhaseIdx !== idx) {
      setPhaseImageLoading(true);
      setSelectedPhaseIdx(idx);
    }
  };

  const handleProject = (data) => {
    setProjectList((prev) => {
      const exists = prev.some((p) => p.id === data.id);
      let updatedList;
      if (exists) {
        // Edit: update the project
        updatedList = prev.map((p) => (p.id === data.id ? data : p));
      } else {
        // Add: append the new project
        updatedList = [...prev, data];
      }
      return updatedList;
    });
    setSelectedProject(data);
  };

  const handlePhase = (data) => {
    setSelectedProject((prev) => {
      const updatedPhases = [...(prev.phases || [])];
      if (data.id) {
        // Edit: update the existing phase
        const phaseIndex = updatedPhases.findIndex((p) => p.id === data.id);
        if (phaseIndex !== -1) {
          updatedPhases[phaseIndex] = data;
        } else {
          // Add: append the new phase
          updatedPhases.push(data);
          setSelectedPhaseIdx(updatedPhases.length - 1);
        }
      }
      return {
        ...prev,
        phases: updatedPhases,
      };
    });
    setShowPhaseDialog(false);
  };

  const deleteproject = async (project_id) => {
    try {
      const res = await deleteProject(project_id);
      if (res.code === 409) {
        toast.error(t.associateProject);
      } else if (res.code === 200) {
        toast.success(t.projectDelete);
        setProjectList((prev) => {
          const updatedList = prev.filter((p) => p.id !== project_id);
          if (selectedProject?.id === project_id) {
            setSelectedProject(updatedList[0] || null);
          }
          return updatedList;
        });
      }
    } catch (error) {
      toast.error(t.failedProject);
    }
  };

  const handleDeleteClick = (project, e) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };

  const handleEditClick = (project) => {
    setShowProjectDialog(true);
    setProjectToEdit(project);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteproject(projectToDelete.id);
      setShowDeleteDialog(false);
      setProjectToDelete(null);
    } else if (phaseToDelete) {
      handleDeletePhase(phaseToDelete);
      setShowDeleteDialog(false);
      setPhaseToDelete(null);
    }
  };

  const handleDeletePhase = async (phase) => {
    try {
      const res = await deletePhase(selectedProject.id, phase.id);
      if (res.code === 200) {
        toast.success(t.phasee.delete);
        setSelectedProject((prev) => {
          const updatedPhases = Array.isArray(prev?.phases)
            ? prev.phases.filter((p) => p.id !== phase.id)
            : [];
          // Calculate new selectedPhaseIdx
          let newIdx = selectedPhaseIdx;
          if (updatedPhases.length === 0) {
            newIdx = -1; // No phases left
          } else if (selectedPhaseIdx >= updatedPhases.length) {
            newIdx = updatedPhases.length - 1; // Select previous phase
          }
          setSelectedPhaseIdx(newIdx);
          return {
            ...prev,
            phases: updatedPhases,
          };
        });
      }
    } catch (error) {
      toast.error(t.failedPhase);
    }
  };

  const handleImported = async () => {
    try {
      await refetch();
      toast.success(
        t.projectPage?.importSuccess ||
          "Projects imported successfully."
      );
      setSearchQuery("");
    } catch (error) {
      console.error("Error refetching projects after import:", error);
      toast.error(
        t.projectPage?.importRefetchError ||
          "Failed to refresh projects list."
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
    if (selectedCities.includes(city)) {
      setSelectedCities(selectedCities.filter((c) => c !== city));
    } else {
      setSelectedCities([...selectedCities, city]);
    }
  };

  const handleSelectAllCities = () => {
    if (selectedCities.length === translations.cities.length) {
      setSelectedCities([]);
    } else {
      setSelectedCities([...translations.cities]);
    }
  };

  const getCityFilterDisplayText = () => {
    if (selectedCities.length === 0) {
      return locale === "ar" ? "جميع المدن" : "All Cities";
    }
    if (selectedCities.length === translations.cities.length) {
      return locale === "ar" ? "جميع المدن" : "All Cities";
    }
    if (selectedCities.length === 1) {
      return getCityDisplayName(selectedCities[0]);
    }
    return locale === "ar"
      ? `${selectedCities.length} مدن`
      : `${selectedCities.length} Cities`;
  };

  // Helper function to get district label with fallback
  const getDistrictDisplayName = (district, city) => {
    if (!district) return "";
    if (!city) return capitalize(district);
    
    const cityKey = String(city).toLowerCase().trim();
    const districtKey = String(district).toLowerCase().trim();
    const key = `${cityKey}|${districtKey}`;
    
    // First try pre-loaded labels
    if (translations.districtLabels[key]) {
      return translations.districtLabels[key];
    }
    
    // Fallback: try to get from CityManager if available
    const manager = CityManager.getInstance();
    if (manager.isInitialized && manager.cities.length > 0 && manager.districts.length > 0) {
      const cityObj = manager.cities.find(c => 
        c.value === cityKey || 
        c.id.toLowerCase() === cityKey
      );
      if (cityObj) {
        const districtObj = manager.districts.find(
          d => d.city_id === cityObj.id && 
          (d.value === districtKey || 
           d.en_name.toLowerCase() === districtKey ||
           d.ar_name === district)
        );
        if (districtObj) {
          return locale === "ar" ? districtObj.label_ar : districtObj.label_en;
        }
      }
    }
    
    // Final fallback
    return capitalize(district);
  };

  return (
    <>
      {showProjectDialog && (
        <AddCompoundDialog
          isOpen={showProjectDialog}
          onClose={() => {
            setShowProjectDialog(false);
            setProjectToEdit(null);
          }}
          compoundData={projectToEdit}
          onAdd={handleProject}
          clientId={clientId}
        />
      )}

      {projectToDelete || phaseToDelete ? (
        <DeleteConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setProjectToDelete(null);
            setPhaseToDelete(null);
          }}
          confirmLabel={t.deleteButton}
          cancelLabel={t.cancelButton}
          onConfirm={handleConfirmDelete}
          title={projectToDelete ? t.deleteProjectTitel : t.deletePhaseTitel}
          message={`${t.sureDelet} ${projectToDelete ? `"${projectToDelete?.name}"` : `"${phaseToDelete?.name}"`}? ${" "} ${t.actionDelet}`}
        />
      ) : null}

      {showPhaseDialog && (
        <AddPhaseDialog
          isOpen={showPhaseDialog}
          onClose={() => {
            setShowPhaseDialog(false);
            setPhaseToEdit(null);
          }}
          phaseData={phaseToEdit}
          onAdd={handlePhase}
          projectId={selectedProject?.id}
        />
      )}

      <div className="bg-gray-50 flex flex-col gap-4 p-3 relative flex-1 min-h-0 h-full">
        {/* Header Section - Full Width */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="bg-primary p-4 rounded-t-lg flex flex-col gap-3">
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <h2 className="text-white text-xl font-semibold flex-shrink-0">
                {t.sidebar.myProjects}
              </h2>
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <div className="flex-1">
                  <ReusableSearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={t.projectPage?.searchPlaceholder || "Search projects..."}
                    variant="white"
                    className="w-full"
                  />
                </div>
                {/* City Filter */}
                {translations.cities.length > 0 && (
                  <div className="relative" ref={cityFilterRef}>
                    <button
                      type="button"
                      onClick={() => setIsCityFilterOpen(!isCityFilterOpen)}
                      className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-50 min-w-[150px] h-10 justify-between disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
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
                      <div className="absolute z-50 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                        <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-700">
                              {locale === "ar" ? "تصفية حسب المدينة" : "Filter by City"}
                            </h3>
                            <button
                              onClick={handleSelectAllCities}
                              className="text-xs text-primary hover:underline"
                            >
                              {selectedCities.length === translations.cities.length
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
                {/* Developer Filter */}
                <div className="min-w-[180px]">
                  <SearchableDropdownSelect
                    options={developers}
                    value={selectedDeveloper}
                    onChange={(e) => setSelectedDeveloper(e.target.value)}
                    name="developer"
                    placeholder={
                      developersLoading
                        ? (locale === "ar" ? "جاري التحميل..." : "Loading...")
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
                    getLabel={(option, locale) =>
                      locale === "ar" ? option.ar_name || option.en_name : option.en_name || option.ar_name
                    }
                    searchFields={["ar_name", "en_name"]}
                    className="w-full"
                    buttonClassName="rounded-lg border-0 px-4 py-2 h-10 bg-white text-primary hover:bg-gray-50 focus:ring-0 focus:border-0 disabled:bg-gray-50 disabled:text-gray-400 disabled:opacity-60 transition-colors duration-200"
                    disabled={developersLoading}
                    isLoading={developersLoading}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowProjectDialog(true)}
                  className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <Plus size={20} />
                  <span>{t.projectPage?.add || t.addNewProject || "Add"}</span>
                </button>
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="flex items-center gap-2 bg-white/90 text-primary px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-white"
                >
                  <Plus size={20} />
                  <span>{t.projectPage?.importButton || "Import"}</span>
                </button>
                <VideoInstructionsDialog
                  variant="projects"
                  iconSize="lg"
                  iconClassName="hover:bg-white/20"
                  svgClassName="text-white"
                  tooltipText={
                    t.projectsPage?.instructions || "How to manage projects"
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Projects List and Details Section */}
        <div className="flex flex-col xl:flex-row gap-4 relative flex-1 min-h-0">
          {/* Visual Connection Indicator */}
          {selectedProject && (
            <div className="hidden xl:flex absolute left-[45%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transition-opacity duration-300 pointer-events-none">
              <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-sm rounded-full px-3 py-2 border-2 border-primary/30 shadow-lg">
                <ChevronsRight
                  size={24}
                  className="text-primary animate-pulse"
                  strokeWidth={2.5}
                />
              </div>
            </div>
          )}
          <div className="bg-white w-full xl:w-45/100 h-full rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="h-full overflow-y-auto">
            {isLoading ? (
              <LoadingSpinner containerClassName="flex items-center justify-center p-6" />
            ) : isError ? (
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
            ) : projectList.length === 0 ? (
              // <div className="flex flex-col items-center justify-center p-6">
              //   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              //     <svg
              //       className="w-8 h-8 text-gray-400"
              //       fill="none"
              //       stroke="currentColor"
              //       viewBox="0 0 24 24"
              //     >
              //       <path
              //         strokeLinecap="round"
              //         strokeLinejoin="round"
              //         strokeWidth={2}
              //         d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2M7 7h10"
              //       />
              //     </svg>
              //   </div>
              //   <p className="text-center font-medium text-xl text-gray-400">
              //     {t.projectUndfined}
              //   </p>
              // </div>
              <EmptyStateVideo variant="projects" autoPlay showControls loop />
            ) : (
              <div className="space-y-3 p-4">
                {projectList.map((project) => (
                  <div
                    key={project.id}
                    className={`rounded-lg p-3 border-2 transition-all duration-200 cursor-pointer relative ${
                      selectedProject?.id === project.id
                        ? "border-primary shadow-lg bg-[#E2DBFF33]"
                        : "bg-gray-50 border-gray-200 hover:shadow-md hover:border-gray-300"
                    }`}
                    onClick={() => handleProjectSelection(project)}
                  >
                    {/* Visual indicator arrow pointing to details */}
                    {selectedProject?.id === project.id && (
                      <div className="hidden xl:block absolute -right-6 top-1/2 -translate-y-1/2 z-10">
                        <ChevronRight
                          size={24}
                          className="text-primary animate-pulse"
                          strokeWidth={2.5}
                        />
                      </div>
                    )}
                    <h3
                      className={`font-semibold text-lg ${
                        selectedProject?.id === project.id
                          ? "text-primary"
                          : "text-gray-800"
                      }`}
                    >
                      {(locale === "ar"
                        ? project?.ar_name ?? project?.en_name
                        : project?.en_name ?? project?.ar_name) ?? ""}
                    </h3>
                    <div
                      className={`flex items-center space-x-4 text-sm mb-2 ${
                        selectedProject?.id === project.id
                          ? "text-primary"
                          : "text-gray-600"
                      }`}
                    >
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {getCityDisplayName(project.city)}
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        {getDistrictDisplayName(project.district, project.city)}
                      </div>
                      <div className="flex-1"></div>
                      <button
                        onClick={() => handleEditClick(project)}
                        className="ml-2 h-8 w-8 p-2 bg-white/90 text-gray-700 rounded-full shadow transition-all duration-200 aspect-square flex-shrink-0"
                        style={{ height: '32px', width: '32px', minHeight: '32px', maxHeight: '32px' }}
                        title="Edit Project"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(project, e)}
                        className="ml-1 h-8 w-8 p-2 bg-white/90 hover:bg-red-600 text-gray-700 hover:text-white rounded-full shadow transition-all duration-200 aspect-square flex-shrink-0"
                        style={{ height: '32px', width: '32px', minHeight: '32px', maxHeight: '32px' }}
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Property Types and Payment Plans */}
                    <div className="space-y-2">
                      {project.properties_types &&
                        project.properties_types.length > 0 && (
                          <div
                            className={
                              selectedProject?.id === project.id
                                ? "opacity-90"
                                : ""
                            }
                          >
                            <PropertyTypesBadges
                              types={project.properties_types}
                              locale={locale}
                              buildingTypes={BUILDING_TYPES}
                              maxDisplay={2}
                            />
                          </div>
                        )}

                      {project.payment_plans &&
                        project.payment_plans.length > 0 && (
                          <div
                            className={
                              selectedProject?.id === project.id
                                ? "opacity-90"
                                : ""
                            }
                          >
                            <PaymentPlansBadges
                              plans={project.payment_plans}
                              locale={locale}
                              maxDisplay={2}
                            />
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>

          {/* Right Panel - Details/Map/etc */}
        {projectList.length > 0 && (
          <div
            className={`flex-1 h-fit overflow-hidden bg-white rounded-lg shadow-sm border-2 transition-all duration-300 ${
              selectedProject
                ? "border-primary shadow-lg shadow-primary/10"
                : "border-gray-200"
            }`}
          >
            {selectedProject && (
              <>
                {(selectedProject.master_plan?.url ||
                  selectedProject.images?.length > 0) && (
                  <div
                    className="h-80 relative cursor-pointer group"
                    onClick={() => {
                      setFullScreenImages(selectedProject.images || []);
                      setFullScreenMasterPlan(
                        selectedProject.master_plan?.url || null
                      );
                      setShowFullScreenSwiper(true);
                    }}
                  >
                    <ImageWithLoader
                      src={
                        selectedProject.master_plan?.url ||
                        selectedProject?.images[0]?.url ||
                        "/images/defaultImage.jpg"
                      }
                      alt={selectedProject.name || "Project Master Plan"}
                      className="w-full h-full object-cover"
                      priority={true}
                      loadingVariant="default"
                      forceLoading={projectImageLoading}
                      onLoadComplete={() => setProjectImageLoading(false)}
                    />
                    {/* Sold Out Badge */}
                    {selectedProject.is_active === false && (
                      <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg z-10 flex items-center gap-2">
                        <X size={18} className="stroke-[3]" />
                        <span>
                          {locale === "ar" ? "نفذت الكمية" : "Sold Out"}
                        </span>
                      </div>
                    )}
                    {/* Overlay for indication */}
                    {(selectedProject.images?.length > 0 ||
                      selectedProject.master_plan?.url) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-10 h-10 text-white mb-2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10l4.553 2.276A2 2 0 0121 14.118V17a2 2 0 01-2 2H5a2 2 0 01-2-2v-2.882a2 2 0 01.447-1.342L8 10m7 0V7a5 5 0 00-10 0v3m10 0H8"
                          />
                        </svg>
                        <span className="text-white text-lg font-semibold">
                          {(selectedProject.master_plan?.url ? 1 : 0) +
                            (selectedProject.images?.length || 0)}{" "}
                          {t?.images || "Images"}
                        </span>
                        <span className="text-white text-xs mt-1">
                          {t?.clickToView || "Click to view"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {selectedProject.description && (
                  <div className="text-gray-700 p-4 leading-relaxed">
                    <h4 className="font-semibold text-lg text-gray-700">
                      {t.description}
                    </h4>
                    <p>{selectedProject.description}</p>
                  </div>
                )}

                {/* Building Types Images Section - lazy: images load only when section is visible */}
                {((selectedProject.building_types_images &&
                  Object.keys(selectedProject.building_types_images).length >
                    0) ||
                  (selectedProject.types_photos &&
                    Object.keys(selectedProject.types_photos).length > 0)) && (
                    <LazyVisible
                      placeholder={
                        <div className="p-4 border-t border-gray-200">
                          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="aspect-square rounded-lg bg-gray-100 animate-pulse"
                              />
                            ))}
                          </div>
                        </div>
                      }
                    >
                      <div className="p-4 border-t border-gray-200">
                        <h4 className="font-semibold text-lg text-gray-700 mb-4 flex items-center gap-2">
                          <ImageIcon size={20} className="text-purple-600" />
                          {locale === "ar"
                            ? "صور أنواع المباني"
                            : "Building Types Images"}
                        </h4>
                        <div className="space-y-6">
                          {selectedProject.properties_types?.map((type) => {
                            // Check both building_types_images and types_photos for backward compatibility
                            let typeImages = null;

                            // First check building_types_images (new format with objects)
                            if (
                              selectedProject.building_types_images?.[type] &&
                              Array.isArray(selectedProject.building_types_images[type])
                            ) {
                              typeImages = selectedProject.building_types_images[type];
                            }
                            // Fallback to types_photos (legacy format with URL strings)
                            else if (
                              selectedProject.types_photos?.[type] &&
                              Array.isArray(selectedProject.types_photos[type])
                            ) {
                              typeImages = selectedProject.types_photos[type].map(
                                (url) => (typeof url === "string" ? { url } : url)
                              );
                            }

                            if (!typeImages || typeImages.length === 0)
                              return null;

                            const typeLabel = getPropertyTypeLabel(
                              type,
                              locale,
                              BUILDING_TYPES
                            );

                            return (
                              <div
                                key={type}
                                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-semibold text-base text-gray-800 flex items-center gap-2">
                                    <Home size={16} className="text-purple-600" />
                                    {typeLabel}
                                  </h5>
                                  <span className="text-sm text-gray-500">
                                    {typeImages.length}{" "}
                                    {locale === "ar" ? "صورة" : "image"}
                                    {typeImages.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                  {typeImages.slice(0, 4).map((img, idx) => (
                                    <div
                                      key={idx}
                                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border border-gray-200 hover:border-primary transition-colors"
                                      onClick={() => {
                                        setBuildingTypeImagesModal({
                                          open: true,
                                          images: typeImages,
                                          title: typeLabel,
                                        });
                                      }}
                                    >
                                      <ImageWithLoader
                                        src={img.url || "/images/defaultImage.jpg"}
                                        alt={`${typeLabel} - ${idx + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        priority={false}
                                        loadingVariant="minimal"
                                      />
                                      {idx === 3 && typeImages.length > 4 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold">
                                          +{typeImages.length - 4}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {typeImages.length > 4 && (
                                  <button
                                    onClick={() => {
                                      setBuildingTypeImagesModal({
                                        open: true,
                                        images: typeImages,
                                        title: typeLabel,
                                      });
                                    }}
                                    className="mt-3 text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                                  >
                                    {locale === "ar"
                                      ? "عرض جميع الصور"
                                      : "View all images"}
                                    <ChevronRight size={16} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </LazyVisible>
                  )}

                {/* Project Details Section */}
                <div className="p-4 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Property Types Section */}
                    {selectedProject.properties_types &&
                      selectedProject.properties_types.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                            <Home size={20} className="text-blue-600" />
                            {t.formLabels?.propertyTypes || "Property Types"}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedProject.properties_types.map(
                              (type, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium rounded-lg flex items-center gap-2"
                                >
                                  <Tag size={14} />
                                  {getPropertyTypeLabel(type, locale, BUILDING_TYPES)}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Payment Plans Section */}
                    {selectedProject.payment_plans &&
                      selectedProject.payment_plans.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                            <CreditCard size={20} className="text-green-600" />
                            {t.formLabels?.paymentPlans || "Payment Plans"}
                          </h4>
                          <div className="space-y-2">
                            {selectedProject.payment_plans.map(
                              (plan, index) => (
                                <div
                                  key={index}
                                  className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-between ${
                                    plan.is_default
                                      ? "bg-blue-50 border-2 border-blue-300 text-blue-900"
                                      : "bg-green-50 border border-green-200 text-green-800"
                                  }`}
                                >
                                  <span>{formatPaymentPlan(plan, locale)}</span>
                                  {plan.is_default && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
                                      {locale === "ar" ? "افتراضي" : "Default"}
                                    </span>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Additional Project Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100">
                    {selectedProject.area && (
                      <div className="flex flex-col items-center justify-between">
                        <div className="text-xl font-bold text-primary">
                          {selectedProject.area}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.formLabels?.area}
                        </div>
                      </div>
                    )}

                    {selectedProject.units_count !== undefined && selectedProject.units_count !== null && (
                      <div className="flex flex-col items-center justify-between">
                        <div className="text-xl font-bold text-primary">
                          {selectedProject.units_count}
                        </div>
                        <div className="text-xs text-gray-500">
                          {locale === "ar" ? "عدد الوحدات" : "Units Count"}
                        </div>
                      </div>
                    )}

                    {selectedProject.gated !== undefined && (
                      <div className="flex flex-col items-center justify-between">
                        <div className="text-xl font-bold text-primary">
                          {selectedProject.gated
                            ? locale === "ar"
                              ? "نعم"
                              : "Yes"
                            : locale === "ar"
                              ? "لا"
                              : "No"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.formLabels?.gatedCommunity || "Gated Community"}
                        </div>
                      </div>
                    )}

                    {selectedProject.city && (
                      <div className="flex flex-col items-center justify-between">
                        <div
                          className="text-lg font-bold text-primary max-w-full truncate"
                          title={getCityDisplayName(selectedProject.city)}
                        >
                          {getCityDisplayName(selectedProject.city)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.formLabels?.city || "City"}
                        </div>
                      </div>
                    )}

                    {selectedProject.district && (
                      <div className="flex flex-col items-center justify-between">
                        <div
                          className="text-lg font-bold text-primary max-w-full truncate"
                          title={getDistrictDisplayName(selectedProject.district, selectedProject.city)}
                        >
                          {getDistrictDisplayName(selectedProject.district, selectedProject.city)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.formLabels?.district || "District"}
                        </div>
                      </div>
                    )}

                    {selectedProject.developer_name && (
                      <div className="flex flex-col items-center justify-between">
                        <div
                          className="text-lg font-bold text-primary max-w-full truncate"
                          title={selectedProject.developer_name}
                        >
                          {selectedProject.developer_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.formLabels?.developer || "Developer"}
                        </div>
                      </div>
                    )}

                    {selectedProject.phases && (
                      <div className="flex flex-col items-center justify-between">
                        <div className="text-xl font-bold text-primary">
                          {selectedProject.phases.length}
                        </div>
                        <div className="text-xs text-gray-500">{t.phases}</div>
                      </div>
                    )}

                    <div className="flex flex-col items-center justify-between">
                      <div className="text-xl font-bold text-primary">
                        {selectedProject.delivery_date !== undefined && 
                         selectedProject.delivery_date !== null && 
                         selectedProject.delivery_date !== "" &&
                         !isNaN(Number(selectedProject.delivery_date))
                          ? Number(selectedProject.delivery_date)
                          : locale === "ar" ? "غير محدد" : "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {locale === "ar" ? "التسليم (سنوات)" : "Delivery (years)"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary p-4 flex justify-between items-center">
                  <h4 className="font-semibold text-lg  text-white bg-primary">
                    {t.phases}
                  </h4>
                  <button
                    onClick={() => setShowPhaseDialog(true)}
                    className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <Plus size={20} />
                    {t.phasee.addnew || "add new phase"}
                  </button>
                </div>
                <div className="flex flex-col">
                  {(selectedProject.phases ||
                    selectedProject.phases.images?.length > 0) &&
                  selectedProject.phases.length > 0 ? (
                    <LazyVisible
                      placeholder={
                        <div>
                          <div className="h-96 bg-gray-100 animate-pulse" />
                          <div className="flex gap-4 px-4 pb-2 mt-4">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="min-w-[120px] h-20 rounded-lg bg-gray-200 animate-pulse flex-shrink-0"
                              />
                            ))}
                          </div>
                        </div>
                      }
                    >
                    <>
                      <div className="h-96 relative overflow-hidden bg-gray-50 group">
                        <ImageWithLoader
                          src={
                            selectedProject.phases[selectedPhaseIdx]
                              ?.master_plan?.url ||
                            (Array.isArray(
                              selectedProject.phases[selectedPhaseIdx]?.images
                            ) &&
                            selectedProject.phases[selectedPhaseIdx]?.images
                              .length > 0
                              ? selectedProject.phases[selectedPhaseIdx]
                                  ?.images[0].url
                              : "/images/defaultImage.jpg")
                          }
                          alt={
                            selectedProject.phases[selectedPhaseIdx]?.name ||
                            "Phase Image"
                          }
                          className="w-full h-full object-cover"
                          priority={false}
                          loadingVariant="default"
                          forceLoading={phaseImageLoading}
                          onLoadComplete={() => setPhaseImageLoading(false)}
                        />

                        {/* Overlay for indication */}
                        {(selectedProject.phases[selectedPhaseIdx].images
                          ?.length > 0 ||
                          selectedProject.phases[selectedPhaseIdx]?.master_plan
                            ?.url) && (
                          <div
                            className={`absolute inset-0 flex flex-col cursor-pointer items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity`}
                            onClick={() => {
                              setFullScreenImages(
                                selectedProject.phases[selectedPhaseIdx]
                                  .images || []
                              );
                              setFullScreenMasterPlan(
                                selectedProject.phases[selectedPhaseIdx]
                                  ?.master_plan?.url || null
                              );
                              setShowFullScreenSwiper(true);
                            }}
                          >
                            <svg
                              className="w-10 h-10 text-white mb-2"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 10l4.553 2.276A2 2 0 0121 14.118V17a2 2 0 01-2 2H5a2 2 0 01-2-2v-2.882a2 2 0 01.447-1.342L8 10m7 0V7a5 5 0 00-10 0v3m10 0H8"
                              />
                            </svg>
                            <span className="text-white text-lg font-semibold">
                              {(selectedProject.phases[selectedPhaseIdx]
                                ?.master_plan?.url
                                ? 1
                                : 0) +
                                (selectedProject.phases[selectedPhaseIdx].images
                                  ?.length || 0)}{" "}
                              {t?.images || "Images"}
                            </span>
                            <span className="text-white text-xs mt-1">
                              {t?.clickToView || "Click to view"}
                            </span>
                          </div>
                        )}

                        <div className="absolute top-4 right-4 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhaseToEdit(
                                selectedProject.phases[selectedPhaseIdx]
                              );
                              setShowPhaseDialog(true);
                            }}
                            className="p-2 bg-white/90 text-gray-700 rounded-full shadow hover:bg-primary hover:text-white transition-all duration-200"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhaseToDelete(
                                selectedProject.phases[selectedPhaseIdx]
                              );
                              setShowDeleteDialog(true);
                            }}
                            className="p-2 bg-white/90 text-gray-700 rounded-full shadow hover:bg-red-600 hover:text-white transition-all duration-200"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-6 py-4">
                          <div className="text-white">
                            <div className="font-bold text-2xl mb-2 line-clamp-1">
                              {selectedProject?.phases[selectedPhaseIdx]?.name}
                            </div>
                            {selectedProject?.phases[selectedPhaseIdx]
                              ?.description && (
                              <div className="text-base opacity-90 line-clamp-2">
                                {
                                  selectedProject.phases[selectedPhaseIdx]
                                    .description
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex overflow-x-auto gap-4 px-4 pb-2 mt-4 flex-shrink-0">
                        {selectedProject.phases.map((phase, idx) => (
                          <div
                            key={idx}
                            className={`relative min-w-[120px] max-w-[160px] h-20 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0 cursor-pointer transition-all duration-200 ${
                              selectedPhaseIdx === idx
                                ? "ring-2 ring-primary"
                                : ""
                            }`}
                            onClick={() => handlePhaseSelection(idx)}
                          >
                            <ImageWithLoader
                              src={
                                phase.master_plan?.url ||
                                (Array.isArray(phase?.images) &&
                                phase?.images.length > 0
                                  ? phase.images[0].url
                                  : "/images/defaultImage.jpg")
                              }
                              alt={phase.name || "Phase Thumbnail"}
                              className="w-full h-full object-cover"
                              priority={false}
                              loadingVariant="minimal"
                              showLoadingText={false}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                              <div className="text-white text-xs font-semibold line-clamp-1">
                                {phase.name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                    </LazyVisible>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <Clock
                        className="w-16 h-16 text-primary"
                        strokeWidth={1.5}
                      />
                      <p className="text-xl font-normal text-primary mt-3">
                        {t.noPhsesProject}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>

      {showFullScreenSwiper && (
        <ImageSwiperModal
          open={showFullScreenSwiper}
          onClose={() => setShowFullScreenSwiper(false)}
          images={fullScreenImages}
          masterPlan={fullScreenMasterPlan}
        />
      )}

      {buildingTypeImagesModal.open && (
        <ImageSwiperModal
          open={buildingTypeImagesModal.open}
          onClose={() =>
            setBuildingTypeImagesModal({ open: false, images: [], title: "" })
          }
          images={buildingTypeImagesModal.images}
          masterPlan={null}
          showMasterPlanLabel={false}
        />
      )}

      <ImportProjectsDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        clientId={clientId}
        onImported={handleImported}
        existingProjectIds={projectList.map((p) => p.id)}
      />
    </>
  );
}
