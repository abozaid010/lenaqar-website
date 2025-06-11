"use client";

import { useI18n } from "@/context/translate-api";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

import {
  deletePhase,
  deleteProject,
} from "@/components/services/serviceFetching";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import AddCompoundDialog from "../../units/_components/add-compound-dialog";
import AddPhaseDialog from "../../units/_components/AddPhseDilog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

// Capitalize function
const capitalize = (str) => str?.charAt(0).toUpperCase() + str?.slice(1);

export default function ProjectList({
  projects,
  citiesAndDistricts,
  readonly,
  developers,
}) {
  const { t } = useI18n();
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

  const [developersSet, setDevelopersSet] = useState(developers || []);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [projectToDelete, setProjectToDelete] = useState(null);
  const [selectedProject, setSelectedProject] = useState(projects?.[0] || null);
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0);
  const [projectList, setProjectList] = useState(projects || []);
  const [showAddPhaseDialog, setShowAddPhaseDialog] = useState(false);
  const [showEditPhaseDialog, setShowEditPhaseDialog] = useState(false);
  const [phaseToEdit, setPhaseToEdit] = useState(null);
  const [phaseToDelete, setPhaseToDelete] = useState(null);

  const router = useRouter();

  const handleProject = (data) => {
    setProjectList((prev) => {
      const exists = prev.some((p) => p.id === data.id);
      let updatedList;
      if (exists) {
        // Edit: update the project and move it to the top
        updatedList = [data, ...prev.filter((p) => p.id !== data.id)];
      } else {
        // Add: append the new project to the top
        updatedList = [data, ...prev];
      }
      return updatedList;
    });
    setSelectedProject(data);
  };

  const deleteproject = async (project_id) => {
    try {
      const res = await deleteProject(project_id);
      if (res.code === 409) {
        toast.error(t.associateProject);
      } else if (res.code === 200) {
        toast.success(t.projectDelete);
        setProjectList((prev) => {
          // Remove the deleted project
          const updatedList = prev.filter((p) => p.id !== project_id);
          // Move the next project (if any) to the top
          if (updatedList.length > 0) {
            setSelectedProject(updatedList[0]);
          } else {
            setSelectedProject(null);
          }
          return updatedList;
        });
      }
    } catch (error) {
      console.log(error);
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
      setProjectList((prev) => {
        const updatedList = prev.filter((p) => p.id !== projectToDelete.id);
        if (selectedProject?.id === projectToDelete.id) {
          setSelectedProject(updatedList[0] || null);
        }
        return updatedList;
      });
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
      console.log(error);
      toast.error(t.failedPhase);
    }
  };

  return (
    <>
      <AddCompoundDialog
        isOpen={showProjectDialog}
        onClose={() => setShowProjectDialog(false)}
        compoundData={projectToEdit}
        onAdd={handleProject}
        Egypt_cities={formattedDataCitiesAndDistricts}
        developers={developersSet}
        setDevelopers={setDevelopersSet}
        clientId={clientId}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setProjectToDelete(null);
          setPhaseToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        projectName={projectToDelete?.name || phaseToDelete?.name}
      />

      <AddPhaseDialog
        isOpen={showEditPhaseDialog}
        onClose={() => setShowEditPhaseDialog(false)}
        onAdd={(updatedPhase) => {
          setSelectedProject((prev) => ({
            ...prev,
            phases: prev.phases.map((phase, idx) =>
              idx === selectedPhaseIdx ? updatedPhase : phase
            ),
          }));
          setShowEditPhaseDialog(false);
          router.refresh();
        }}
        projectIdPhase={selectedProject?.id}
        editMode={true}
        phaseData={phaseToEdit}
      />

      <AddPhaseDialog
        isOpen={showAddPhaseDialog}
        onClose={() => setShowAddPhaseDialog(false)}
        onAdd={(newPhase) => {
          setSelectedProject((prev) => ({
            ...prev,
            phases: [...prev.phases, newPhase],
          }));
          setShowAddPhaseDialog(false);
          router.refresh();
        }}
        projectId={selectedProject?.id}
        editMode={false}
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
                      {capitalize(project.name)}
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
                        {capitalize(project.city)}
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
                        {capitalize(project.district)}
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
                {selectedProject.master_plan && (
                  <div className="h-80 relative">
                    <Image
                      src={
                        selectedProject.master_plan ||
                        "/images/defaultImage.jpg"
                      }
                      alt={selectedProject.name || "Project Master Plan"}
                      fill
                      objectFit="cover"
                      priority
                    />
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
                    onClick={() => setShowAddPhaseDialog(true)}
                    className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <Plus size={20} />
                    {t.phasee.addnew || "add new phase"}
                  </button>
                </div>
                <div className="flex flex-col">
                  {selectedProject.phases &&
                  selectedProject.phases.length > 0 ? (
                    <>
                      <div className="h-96 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={
                            selectedProject.phases[selectedPhaseIdx]
                              ?.master_plan || "/images/defaultImage.jpg"
                          }
                          alt={
                            selectedProject.phases[selectedPhaseIdx]?.name ||
                            "Phase Image"
                          }
                          fill
                          objectFit="cover"
                          priority
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button
                            onClick={() => {
                              setPhaseToEdit(
                                selectedProject.phases[selectedPhaseIdx]
                              );
                              setShowEditPhaseDialog(true);
                            }}
                            className="p-2 bg-white/90 text-gray-700 rounded-full shadow hover:bg-primary hover:text-white transition-all duration-200"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => {
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
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-6">
                          <div className="text-white">
                            <div className="font-bold text-2xl mb-2 line-clamp-1">
                              {selectedProject?.phases[selectedPhaseIdx]?.name}
                            </div>
                            {selectedProject?.phases[selectedPhaseIdx]
                              ?.description && (
                              <div className="text-base opacity-90 line-clamp-3">
                                {
                                  selectedProject.phases[selectedPhaseIdx]
                                    .description
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex overflow-x-auto gap-4 pb-2 mt-4 flex-shrink-0">
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
                                phase.master_plan || "/images/defaultImage.jpg"
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
    </>
  );
}
