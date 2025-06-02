"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/context/translate-api";
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Eye,
  Play,
  Plus,
} from "lucide-react";

import { useState } from "react";
import {
  deleteProject,
  getShareUnitData,
} from "@/components/services/serviceFetching";
import AddCompoundDialog from "../../units/_components/add-compound-dialog";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import Cookies from "js-cookie";

// Capitalize function
const capitalize = (str) => str?.charAt(0).toUpperCase() + str?.slice(1);

export default function ProjectList({ projects,citiesAndDistricts ,readonly ,  developers }) {
  const { t } = useI18n();
  const clientId = Cookies.get("client_id");

 
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

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(projects?.[0] || null);
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0);
  const [projectList, setProjectList] = useState(projects);
 
  const developersSet = Array.from(
    new Set(developers.map((developer) => developer.name))
  );
  // Initialize router
  const router = useRouter();

  // Function to handle project updates from the dialog
  const handleProjectUpdate = (updatedProject) => {
    // تحديث قائمة المشاريع
    setProjectList((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    router.refresh();
    // إذا كان المشروع المعروض هو نفسه الذي تم تعديله، حدثه في selectedProject
    if (selectedProject && selectedProject.id === updatedProject.id) {
      setSelectedProject(updatedProject);
      router.refresh();
    }
  };

  const deleteproject = async (project_id) => {
    try {
      const res = await deleteProject(project_id);
      if (res.code === 409) {
        toast.error(t.associateProject);
      } else if (res.code === 200) {
        toast.success(t.projectDelete);
        // Update project list and selected project
        setProjectList((prev) => {
          const updatedList = prev.filter(p => p.id !== project_id);
          // If the deleted project was selected, select the first available project
          if (selectedProject?.id === project_id) {
            setSelectedProject(updatedList[0] || null);
          }
          return updatedList;
        });
        router.refresh();
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

  const handleEditClick = (project, e) => {
    e.stopPropagation();
    setShowEditDialog(true);
    setProjectToEdit(project);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteproject(projectToDelete.id);
      // Update project list and selected project
      setProjectList((prev) => {
        const updatedList = prev.filter(p => p.id !== projectToDelete.id);
        // If the deleted project was selected, select the first available project
        if (selectedProject?.id === projectToDelete.id) {
          setSelectedProject(updatedList[0] || null);
        }
        return updatedList;
      });
      setShowDeleteDialog(false);
      setProjectToDelete(null);
    }
  };

  const toggleExpand = (projectId) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  return (
    <>
      {/* Edit Dialog */}
      <AddCompoundDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        compoundData={projectToEdit}
        editMode={true}
        onAdd={handleProjectUpdate}
        Egypt_cities={formattedDataCitiesAndDistricts}
      />

      {/* Add New Project Dialog */}
      
      <AddCompoundDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={(newProject) => {
          setProjectList((prev) => [...prev, newProject]);
          setSelectedProject(newProject);
          router.refresh();
        }}
        developers={developersSet}
        clientId={clientId}
        editMode={false}
        showName={true}
        projectId={projectId}
        setProjectId={setProjectId}

        // Egypt_cities={citiesAndDistricts}
        Egypt_cities={formattedDataCitiesAndDistricts}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        projectName={projectToDelete?.name}
      />

      <div className=" bg-gray-50 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 ">
        {/* Projects Section */}
        <div className={`${projects?.length === 0 ? 'lg:col-span-4' : 'lg:col-span-2'} bg-white  rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col`}>
          <div className="bg-primary p-4 flex justify-between items-center">
            <h2 className="text-white text-xl font-semibold">{t.sidebar.myProjects}</h2>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 bg-white text-primary   px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Plus size={20} />
              <span> {t.addNewProject}</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col">
            {projects?.length === 0 || projects === null ? (
              <div className="flex flex-col items-center justify-center flex-1 p-6">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <p className="text-center font-medium text-xl text-gray-400">
                  {t.projectUndfined}
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-4 overflow-y-auto flex-1">
                {projects?.map((project) => (
                  <div
                    key={project.id}
                    className={`bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer ${
                      selectedProject?.id === project.id ? 'bg-primary text-white' : ''
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <h3 className={`font-semibold text-lg mb-2 ${
                      selectedProject?.id === project.id ? 'text-white' : 'text-gray-800'
                    }`}>
                      {capitalize(project.name)}
                    </h3>
                    <div className={`flex items-center space-x-4 text-sm w-full ${
                      selectedProject?.id === project.id ? 'text-white' : 'text-gray-600'
                    }`}>
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
                        onClick={(e) => handleEditClick(project, e)}
                        className="ml-2 p-2 bg-white/90  text-gray-700  rounded-full shadow transition-all duration-200"
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
        {projects?.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="">
              {selectedProject ? (
                <div>
                  {selectedProject.master_plan ? (
                    <div className="w-full h-80 relative mb-6  overflow-hidden ">
                      <Image
                        src={
                          selectedProject.master_plan ||
                          "/images/defaultImage.jpg"
                        }
                        alt={selectedProject.name || "Project Master Plan"}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                      <div className="w-full h-80 relative mb-6  overflow-hidden ">
                      <Image
                        src={
                          selectedProject.master_plan ||
                          "/images/defaultImage.jpg"
                        }
                        alt={selectedProject.name || "Project Master Plan"}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}

                  {selectedProject.description && (
                    <div className="mb-4 text-gray-700 p-4 leading-relaxed">
                      <h4 className="font-semibold text-lg mb-2 text-gray-700">{t.description}</h4>
                      <p>{selectedProject.description}</p>
                    </div>
                  )}
                  <div className="p-4 ">
                    <h4 className="font-semibold text-lg mb-2 text-white p-4 bg-primary">
                      {t.phases}
                    </h4>
                    {/* Fixed height container for phases section */}
                    <div className="h-[500px] flex flex-col">
                      {selectedProject.phases && selectedProject.phases.length > 0 ? (
                        <>
                          {/* Main selected phase full screen */}
                          <div className="w-full h-96 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
                              className="object-cover"
                              priority
                              sizes="100vw"
                            />
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
                          {/* Thumbnails for other phases with scroll */}
                          <div className="flex overflow-x-auto gap-4 pb-2 mt-4 flex-shrink-0">
                            {selectedProject.phases.map((phase, idx) => (
                              <div
                                key={idx}
                                className={`relative min-w-[120px] max-w-[160px] h-20 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0 cursor-pointer transition-all duration-200 ${
                                  selectedPhaseIdx === idx ? 'ring-2 ring-primary' : ''
                                }`}
                                onClick={() => setSelectedPhaseIdx(idx)}
                              >
                                <Image
                                  src={
                                    phase.master_plan || "/images/defaultImage.jpg"
                                  }
                                  alt={phase.name || "Phase Thumbnail"}
                                  fill
                                  className="object-cover"
                                  sizes="200px"
                                />
                                {/* Overlay for name */}
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
                        <div className="flex flex-col items-center justify-center h-full">
                          <svg
                            className="w-16 h-16 text-blue-400 mb-6  "
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 3 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6 1a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p className="text-xl font-normal text-primary mb-2">
                            {t.noPhsesProject}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  {projects?.length > 0 ? (
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
          </div>
        )}
      </div>
    </>
  );
}