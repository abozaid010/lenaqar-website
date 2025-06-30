"use client";

import { useI18n } from "@/context/translate-api";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

import {
  deletePhase,
  deleteProject,
} from "@/components/services/serviceFetching";
import AddCompoundDialog from "@/components/ui/add-compound-dialog";
import AddPhaseDialog from "@/components/ui/add-phase-dialog";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import ImageSwiperModal from "@/components/ui/images-swiper-modal";
import { formatCityLabel, formatDistrictLabel } from "@/utils/formatters";
import Cookies from "js-cookie";
import { useState } from "react";
import toast from "react-hot-toast";
import "swiper/css";
import "swiper/css/pagination";

// Capitalize function
const capitalize = (str) => str?.charAt(0).toUpperCase() + str?.slice(1);

export default function ProjectList({
  projects,
  citiesAndDistricts,
  readonly,
  developers,
}) {
  const { t, locale } = useI18n();
  const clientId = Cookies.get("lena-website-client_id");

  const formattedDataCitiesAndDistricts = !readonly
    ? Object.entries(citiesAndDistricts)
        .filter(([governorate]) => governorate !== "cities")
        .map(([governorate, districts]) => ({
          governorate,
          districts: districts.map((district) => ({
            district,
          })),
        }))
    : [];

  const [showFullScreenSwiper, setShowFullScreenSwiper] = useState(false);
  const [fullScreenImages, setFullScreenImages] = useState([]);
  const [fullScreenMasterPlan, setFullScreenMasterPlan] = useState(null);

  const [developersSet, setDevelopersSet] = useState(developers || []);

  const [projectList, setProjectList] = useState(projects || []);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [selectedProject, setSelectedProject] = useState(projects?.[0] || null);

  const [showPhaseDialog, setShowPhaseDialog] = useState(false);
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0);
  const [phaseToEdit, setPhaseToEdit] = useState(null);
  const [phaseToDelete, setPhaseToDelete] = useState(null);

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
      <AddCompoundDialog
        isOpen={showProjectDialog}
        onClose={() => {
          setShowProjectDialog(false);
          setProjectToEdit(null);
        }}
        compoundData={projectToEdit}
        onAdd={handleProject}
        Egypt_cities={formattedDataCitiesAndDistricts}
        developers={developersSet}
        setDevelopers={setDevelopersSet}
        clientId={clientId}
      />

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

      <div className="bg-gray-50 flex flex-col lg:flex-row gap-4 p-3">
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
            {projectList.length === 0 ? (
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
                {projectList
                  .sort((a, b) => {
                    const nameA = locale === "ar" ? a.ar_name : a.en_name;
                    const nameB = locale === "ar" ? b.ar_name : b.en_name;
                    return nameA.trim().localeCompare(nameB.trim(), locale, {
                      sensitivity: "base",
                    });
                  })
                  .map((project) => (
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
                        className={`flex items-center space-x-4 text-sm ${
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
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Details/Map/etc */}
        {projectList.length > 0 && (
          <div className="flex-1 h-fit overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200">
            {selectedProject ? (
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
                    <Image
                      src={
                        selectedProject.master_plan.url ||
                        selectedProject?.images[0]?.url ||
                        "/images/defaultImage.jpg"
                      }
                      alt={selectedProject.name || "Project Master Plan"}
                      fill
                      objectFit="cover"
                      priority
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
                        <Image
                          src={
                            selectedProject.phases[selectedPhaseIdx]
                              ?.master_plan ||
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
                          fill
                          objectFit="cover"
                          priority
                        />

                        {/* Overlay for indication */}
                        {(selectedProject.phases[selectedPhaseIdx].images
                          ?.length > 0 ||
                          selectedProject.phases[selectedPhaseIdx]
                            ?.master_plan) && (
                          <div
                            className={`absolute inset-0 flex flex-col cursor-pointer items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity`}
                            onClick={() => {
                              setFullScreenImages(
                                selectedProject.phases[selectedPhaseIdx]
                                  .images || []
                              );
                              setFullScreenMasterPlan(
                                selectedProject.phases[selectedPhaseIdx]
                                  ?.master_plan || null
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
                                ?.master_plan
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
                            <Image
                              src={
                                phase.master_plan ||
                                (Array.isArray(phase?.images) &&
                                phase?.images.length > 0
                                  ? phase.images[0].url
                                  : "/images/defaultImage.jpg")
                              }
                              alt={phase.name || "Phase Thumbnail"}
                              fill
                              objectFit="cover"
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
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                {projectList.length > 0 ? (
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"
                      />
                    </svg>
                    <p className="text-gray-500">
                      Select a project to view details
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      <ImageSwiperModal
        open={showFullScreenSwiper}
        onClose={() => setShowFullScreenSwiper(false)}
        images={fullScreenImages}
        masterPlan={fullScreenMasterPlan}
      />
    </>
  );
}
