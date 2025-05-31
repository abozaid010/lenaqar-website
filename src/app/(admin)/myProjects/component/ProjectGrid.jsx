"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/context/translate-api";
import { Pencil, Trash2 } from 'lucide-react';

import { useState } from "react";
import { deleteProject, getShareUnitData } from "@/components/services/serviceFetching";
import AddCompoundDialog from "../../units/_components/add-compound-dialog";
import { useRouter } from 'next/navigation';
import toast from "react-hot-toast";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
// import ShareModal from "@/components/ui/units-share-modal";
// import shareButton from "../../../public/share.svg";

export default function ProjectGrid({ projects }) {
    const {t} = useI18n();
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);

    // Initialize router
    const router = useRouter();

    // Function to handle project updates from the dialog
    const handleProjectUpdate = () => {
      // Refresh the current route to re-fetch data and update the grid
      router.refresh();
    };

    const deleteproject = async(project_id)=>{
        try {
            const res = await deleteProject(project_id)
            if(res.code === 409){
                toast.error(t.associateProject)
            } else if(res.code === 200) {
                toast.success(t.projectDelete);
                router.refresh();
            }
        } catch (error) {
            console.log(error)
            toast.error(t.failedProject);
        }
    }

    const handleDeleteClick = (project) => {
        setProjectToDelete(project);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = () => {
        if (projectToDelete) {
            deleteproject(projectToDelete.id);
            setShowDeleteDialog(false);
            setProjectToDelete(null);
        }
    };

  return (
    <>
      {projects.length === 0 ? (
        <div className="text-center font-medium text-xl mt-5 text-gray-400 ">
          No units found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3  mt-4">
          {projects.map((p, idx) => (
            <div
              key={idx}
              className="relative"
            >
              {/* Image Section */}
              <div className="relative w-full h-92 overflow-hidden rounded-md shadow-lg">
                {p.master_plan && p.master_plan.length > 0 ? (
                  <Image
                    fill
                    src={p.master_plan || "/images/defaultImage.jpg"}
                    alt={p.name || p.compound || "Property"}
                    loading="eager"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/defaultImage.jpg";
                      e.currentTarget.onerror = null;
                    }}
                    priority={true}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                  {/* Edit Button */}
                  <div 
                    className="group relative bg-white/90 backdrop-blur-sm hover:bg-primary transition-all duration-300 ease-in-out rounded-full p-2.5 shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-110"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setShowEditDialog(true); 
                      setProjectToEdit(p); 
                    }}
                  >
                    <Pencil 
                      className="text-gray-700 group-hover:text-white transition-colors duration-300 ease-in-out" 
                      size={18} 
                    />
                    {/* Tooltip */}
                  
                  </div>

                  {/* Delete Button */}
                  <div 
                    className="group relative bg-white/90 backdrop-blur-sm hover:bg-red-500 transition-all duration-300 ease-in-out rounded-full p-2.5 shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(p);
                    }}
                  >
                    <Trash2 
                      className="text-gray-700 group-hover:text-white transition-colors duration-300 ease-in-out" 
                      size={18} 
                    />
                    {/* Tooltip */}
                   
                  </div>
                </div>
              </div>

              {/* Text Overlay Section */}
              <div className="absolute bottom-0 left-0 w-full bg-black/40 py-2 px-3 rounded-b-lg">
                <h3 className="text-[20px] font-bold text-white line-clamp-1">
                  {p?.name || "Unnamed Property"}
                </h3>
                <div className="flex items-center justify-between text-[12.5px] text-white font-semibold mb-1">
                  {/* <MapPin className="w-4 h-4 mr-2 flex-shrink-0" /> */}
                  <p className=" text-white font-normal text-[16px]">
                    {" "}
                    {t.city}{" "}
                  </p>
                  <span className="line-clamp-1 text-[14px] font-bold">
                    {p.city || "Location not specified"}
                  </span>
                </div>
                <AddCompoundDialog
                  isOpen={showEditDialog}
                  onClose={() => setShowEditDialog(false)}
                  compoundData={projectToEdit}
                  editMode={true}
                  onAdd={handleProjectUpdate}
                />
                {/* Compound and Purpose Display */}
                {/* <div className="flex flex-wrap justify-between gap-2 mb-2">
                  <p className=" text-white text-[16px] font-normal">
                    {t.project}
                  </p>
                  <div>
                    {p.name && (
                      <span className=" py-1 text-white text-[14px]  rounded-full text-xs font-bold">
                        {p.name}
                      </span>
                    )}
                  </div>
                </div> */}
               
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ShareModal component with the correct props */}
      {/* <ShareModal
        showModal={showModal}
        setShowModal={setShowModal}
        shareData={shareData}
        loadingShare={loadingShare}
      /> */}

      {/* Add DeleteConfirmDialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
            setShowDeleteDialog(false);
            setProjectToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        projectName={projectToDelete?.name}
      />
    </>
  );
}