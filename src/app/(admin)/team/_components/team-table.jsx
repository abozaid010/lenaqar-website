"use client";

import { useI18n } from "@/context/translate-api";
import { deleteEmployee } from "@/utils/api";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import AddNewMember from "./add-new-member";
import EmptyStateVideo from "@/components/ui/empty-state-video";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";

export default function TeamTable({ data, canManageTeam = true }) {
  const router = useRouter();
  const { t } = useI18n();
  const [currentId, setCurrentId] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  useEffect(() => {
    console.log("[TeamTable] Component mounted/updated with data:", {
      dataType: typeof data,
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : 'N/A',
      data: data,
    });
  }, [data]);

  const openDeleteDialog = (id) => {
    setMemberToDelete(id);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    
    setLoadingDelete(true);
    setCurrentId(memberToDelete);
    try {
      console.log("[TeamTable] Attempting to delete employee with ID:", memberToDelete);
      await deleteEmployee(memberToDelete);
      console.log("[TeamTable] Employee deleted successfully");
      toast.success(t?.common?.teamMemberDeleted || "Team member deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("[TeamTable] Failed to delete employee:", {
        id: memberToDelete,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error("Failed to delete team member");
    } finally {
      setLoadingDelete(false);
      setCurrentId(null);
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  // Safely handle data - ensure it's always an array
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div>
      {!safeData || safeData.length === 0 ? (
        <EmptyStateVideo variant="team" autoPlay showControls loop />
      ) : (
        <div className="border border-gray-200 sm:rounded-lg scroll-snap-x-mandatory mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr className="text-left text-xs sm:text-sm font-medium text-gray-600">
                <th className="px-2 py-2 text-center whitespace-nowrap">
                  {t.clientsTable.headers.name || "Name"}
                </th>

                <th className="px-2 py-2 text-center whitespace-nowrap">
                  {t.team.email || "Email"}
                </th>

                <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap">
                  {t.team.phone || "Phone"}
                </th>
                <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap">
                  {t.team.role || "Position"}
                </th>

                {canManageTeam && (
                  <>
                    <th className="px-2 py-2 text-center whitespace-nowrap" />
                    <th className="px-2 py-2 text-center whitespace-nowrap" />
                  </>
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {safeData.map((item) => (
                <tr key={item.id}>
                  <td className="px-2 py-2 font-medium text-gray-600 whitespace-nowrap text-center">
                    {item.name}
                  </td>
                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap text-center">
                    {item.email}
                  </td>
                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap text-center">
                    {item.phone}
                  </td>
                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap text-center">
                    {item.job_title ?? item.position}
                  </td>
                  {canManageTeam && (
                    <>
                      <td className="px-2 py-2 text-center">
                        <AddNewMember isEdit={true} data={item} canManageTeam={canManageTeam} />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => openDeleteDialog(item.id)}>
                          {loadingDelete && currentId === item.id ? (
                            <div className="animate-spin w-4 h-4 border-2 border-gray-400 rounded-full border-t-transparent"></div>
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                          )}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title={t.team?.deleteTitle || "Delete Team Member"}
        message={t.team?.deleteMessage || "Are you sure you want to delete this team member? This action cannot be undone."}
        confirmLabel={t.buttons?.delete || "Delete"}
        cancelLabel={t.buttons?.cancel || "Cancel"}
      />
    </div>
  );
}
