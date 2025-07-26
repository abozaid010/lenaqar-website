"use client";

import { useI18n } from "@/context/translate-api";
import { useCompounds } from "@/hooks/use-admin-shared-data";
import {
  Clock,
  CreditCard,
  Home,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";

import AddCompoundDialog from "@/components/ui/add-compound-dialog";
import AddPhaseDialog from "@/components/ui/add-phase-dialog";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import ImageWithLoader from "@/components/ui/image-with-loader";
import ImageSwiperModal from "@/components/ui/images-swiper-modal";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { BUILDING_TYPES } from "@/data/constants";
import { deletePhase, deleteProject } from "@/utils/api";
import { formatCityLabel, formatDistrictLabel } from "@/utils/formatters";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import "swiper/css";
import "swiper/css/pagination";

// Capitalize function
const capitalize = (str) => str?.charAt(0).toUpperCase() + str?.slice(1);

const getPropertyTypeLabel = (value, locale) => {
  const type = BUILDING_TYPES.find((type) => type.value === value);
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

const PropertyTypesBadges = ({ types, locale, maxDisplay = 3 }) => {
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
          {getPropertyTypeLabel(type, locale)}
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
          className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
        >
          {formatPaymentPlan(plan, locale)}
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
  const { data: compounds, isLoading } = useCompounds(clientId);
  const { t, locale } = useI18n();

  const [showFullScreenSwiper, setShowFullScreenSwiper] = useState(false);
  const [fullScreenImages, setFullScreenImages] = useState([]);
  const [fullScreenMasterPlan, setFullScreenMasterPlan] = useState(null);

  const [projectList, setProjectList] = useState(compounds || []);

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

  useEffect(() => {
    if (!isLoading && compounds) {
      const sorted = compounds.sort((a, b) => {
        const nameA = locale === "ar" ? a.ar_name : a.en_name;
        const nameB = locale === "ar" ? b.ar_name : b.en_name;
        return nameA.trim().localeCompare(nameB.trim(), locale, {
          sensitivity: "base",
        });
      });
      setProjectList(sorted);
      setSelectedProject(sorted[0] || null);
    }
  }, [isLoading]);

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

      <div className="bg-gray-50 flex flex-col xl:flex-row gap-4 p-3">
        <div className="bg-white flex-1 h-fit rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-primary p-4 flex justify-between items-center">
            <h2 className="text-white text-xl font-semibold">
              {t.sidebar.myProjects}
            </h2>
            <button
              onClick={() => setShowProjectDialog(true)}
              className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Plus size={20} />
              <span> {t.addNewProject}</span>
            </button>
          </div>

          <div className="max-h-[80vh] overflow-y-auto">
            {isLoading ? (
              <LoadingSpinner containerClassName="flex items-center justify-center p-6" />
            ) : projectList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <p className="text-center font-medium text-xl text-gray-400">
                  {t.projectUndfined}
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {projectList.map((project) => (
                  <div
                    key={project.id}
                    className={`bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer ${
                      selectedProject?.id === project.id
                        ? "bg-primary text-white"
                        : ""
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <h3
                      className={`font-semibold text-lg ${
                        selectedProject?.id === project.id
                          ? "text-white"
                          : "text-gray-800"
                      }`}
                    >
                      {locale === "ar" ? project.ar_name : project.en_name}
                    </h3>
                    <div
                      className={`flex items-center space-x-4 text-sm mb-2 ${
                        selectedProject?.id === project.id
                          ? "text-white"
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
                        {formatCityLabel(capitalize(project.city), locale)}
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
                        {formatDistrictLabel(
                          capitalize(project.district),
                          capitalize(project.city),
                          locale
                        )}
                      </div>
                      <div className="flex-1"></div>
                      <button
                        onClick={() => handleEditClick(project)}
                        className="ml-2 p-2 bg-white/90 text-gray-700 rounded-full shadow transition-all duration-200"
                        title="Edit Project"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(project, e)}
                        className="ml-1 p-2 bg-white/90 hover:bg-red-600 text-gray-700 hover:text-white rounded-full shadow transition-all duration-200"
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
          <div className="flex-1 h-fit overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200">
            {selectedProject && (
              <>
                {(selectedProject.master_plan.url ||
                  selectedProject.images?.length > 0) && (
                  <div
                    className="h-80 relative cursor-pointer group"
                    onClick={() => {
                      setFullScreenImages(selectedProject.images || []);
                      setFullScreenMasterPlan(
                        selectedProject.master_plan.url || null
                      );
                      setShowFullScreenSwiper(true);
                    }}
                  >
                    <ImageWithLoader
                      src={
                        selectedProject.master_plan.url ||
                        selectedProject?.images[0]?.url ||
                        "/images/defaultImage.jpg"
                      }
                      alt={selectedProject.name || "Project Master Plan"}
                      className="w-full h-full object-cover"
                      priority={true}
                      loadingVariant="default"
                    />
                    {/* Overlay for indication */}
                    {(selectedProject.images?.length > 0 ||
                      selectedProject.master_plan.url) && (
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
                          {(selectedProject.master_plan.url ? 1 : 0) +
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
                                  {getPropertyTypeLabel(type, locale)}
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
                                  className="px-3 py-2 bg-green-50 border border-green-200 text-green-800 text-sm font-medium rounded-lg"
                                >
                                  {formatPaymentPlan(plan, locale)}
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
                    <>
                      <div className="h-96 relative overflow-hidden bg-gray-50 group">
                        <ImageWithLoader
                          src={
                            selectedProject.phases[selectedPhaseIdx]
                              ?.master_plan.url ||
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
                          priority={true}
                          loadingVariant="default"
                        />

                        {/* Overlay for indication */}
                        {(selectedProject.phases[selectedPhaseIdx].images
                          ?.length > 0 ||
                          selectedProject.phases[selectedPhaseIdx]?.master_plan
                            .url) && (
                          <div
                            className={`absolute inset-0 flex flex-col cursor-pointer items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity`}
                            onClick={() => {
                              setFullScreenImages(
                                selectedProject.phases[selectedPhaseIdx]
                                  .images || []
                              );
                              setFullScreenMasterPlan(
                                selectedProject.phases[selectedPhaseIdx]
                                  ?.master_plan.url || null
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
                                ?.master_plan.url
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
                            onClick={() => setSelectedPhaseIdx(idx)}
                          >
                            <ImageWithLoader
                              src={
                                phase.master_plan.url ||
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

      {showFullScreenSwiper && (
        <ImageSwiperModal
          open={showFullScreenSwiper}
          onClose={() => setShowFullScreenSwiper(false)}
          images={fullScreenImages}
          masterPlan={fullScreenMasterPlan}
        />
      )}
    </>
  );
}
