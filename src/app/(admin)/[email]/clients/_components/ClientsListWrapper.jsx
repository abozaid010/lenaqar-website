"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useClients } from "@/hooks/use-clients-data";
import { deleteClient } from "@/utils/api";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { isCurrentUserKingAdmin } from "@/lib/kingAdmin.client";
import EditClientDialog from "./EditClientDialog";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import toast from "react-hot-toast";

const StatusBadge = ({ isActive }) =>
  isActive ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
      Inactive
    </span>
  );

export default function ClientsListWrapper() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [editingClient, setEditingClient] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isKingAdmin, setIsKingAdmin] = useState(false);

  const { items, pagination, isLoading, isError, mutate } = useClients(page);

  // Check if user is king admin on mount
  useEffect(() => {
    setIsKingAdmin(isCurrentUserKingAdmin());
  }, []);

  const clientId = LenaCookiesManager.getClientId();
  const prefix = clientId ? `/${clientId}` : "";

  const totalPages = pagination.total
    ? Math.ceil(pagination.total / 10)
    : page + (pagination.hasNext ? 1 : 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <p className="text-red-600">Failed to load clients. Please try again.</p>
      </div>
    );
  }

  const openDeleteDialog = (clientId) => {
    setClientToDelete(clientId);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    setLoadingDelete(clientToDelete);
    try {
      await deleteClient(clientToDelete);
      toast.success("Client deleted successfully");
      // Refresh data from server to update list
      mutate();
    } catch (error) {
      console.error("Error deleting client:", error);

      // Handle permission denied error
      if (error.code === 'PERMISSION_DENIED' || error.status === 403) {
        toast.error(error.message || "You don't have permission to delete clients. King admin access required.");
      } else {
        toast.error(error.response?.data?.message || "Failed to delete client. Please try again.");
      }
    } finally {
      setLoadingDelete(null);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:justify-between">
          <div className="flex-1" />
          <div className="w-full md:w-auto flex-shrink-0 flex gap-2 items-center">
            <button
              type="button"
              onClick={() => router.push(`${prefix}/clients/new`)}
              className="flex-1 md:flex-initial px-4 py-2 h-10 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
            >
              <Plus size={18} className="shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Create New Client</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-start px-4 py-3 font-medium text-gray-600">Client ID</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Actions</th>
                {isKingAdmin && (
                  <th className="text-start px-4 py-3 font-medium text-gray-600">Delete</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={isKingAdmin ? 8 : 7} className="px-4 py-12 text-center text-gray-500">
                    No clients found.
                  </td>
                </tr>
              ) : (
                items.map((client, index) => (
                  <tr
                    key={`${client.client_id}-${client.email || "no-email"}-${index}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {client.client_id}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {client.client_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{client.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{client.phone_number || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {client.client_type || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={client.is_active} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setEditingClient(client)}
                        className="px-3 py-1 text-xs font-medium text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                    {isKingAdmin && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openDeleteDialog(client.client_id)}
                          disabled={loadingDelete === client.client_id}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {loadingDelete === client.client_id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(pagination.hasNext || page > 1) && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {page} {pagination.total ? `of ${totalPages}` : ""}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Edit dialog */}
      {editingClient && (
        <EditClientDialog
          client={editingClient}
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone and will delete all client data."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
}
