"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useClientsInfinite } from "@/hooks/use-clients-data";
import { deleteClient } from "@/utils/api";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { isCurrentUserKingAdmin } from "@/lib/kingAdmin.client";
import EditClientDialog from "./EditClientDialog";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";

function TableSkeleton({ rows = 8 }) {
  return (
    <tbody className="animate-pulse divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-gray-100 rounded" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function StatusBadge({ isActive, translate }) {
  return isActive ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      {translate("adminClients.statusActive", "Active")}
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
      {translate("adminClients.statusInactive", "Inactive")}
    </span>
  );
}

export default function ClientsListWrapper() {
  const { translate, common } = useI18n();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingClient, setEditingClient] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isKingAdmin, setIsKingAdmin] = useState(false);

  const pendingDeleteClientIdRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const scrollRootRef = useRef(null);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const fetchNextPageRef = useRef(null);
  const hasNextPageRef = useRef(false);
  const isFetchingNextPageRef = useRef(false);
  const lastAutoFetchAtRef = useRef(0);

  const {
    items,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    data,
  } = useClientsInfinite(debouncedSearch);

  useEffect(() => {
    setIsKingAdmin(isCurrentUserKingAdmin());
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
    hasNextPageRef.current = hasNextPage;
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const trimmedSearch = searchInput.trim();
  const showInitialLoading = isLoading && !data;
  const initialListPaint = !showInitialLoading;

  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!hasNextPage || !initialListPaint) return;

    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const throttleMs = 450;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (!hasNextPageRef.current || isFetchingNextPageRef.current) return;
        const now = Date.now();
        if (now - lastAutoFetchAtRef.current < throttleMs) return;
        lastAutoFetchAtRef.current = now;
        fetchNextPageRef.current?.();
      },
      { root, threshold: 0.1, rootMargin: "80px" }
    );
    observerRef.current.observe(sentinel);
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [hasNextPage, initialListPaint, items.length]);

  const clientId = LenaCookiesManager.getClientId();
  const prefix = clientId ? `/${clientId}` : "";

  const openDeleteDialog = useCallback((rowClientId) => {
    const id = rowClientId ?? null;
    pendingDeleteClientIdRef.current = id;
    setClientToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    pendingDeleteClientIdRef.current = null;
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  }, []);

  const confirmDelete = async () => {
    const targetId = pendingDeleteClientIdRef.current ?? clientToDelete;
    if (targetId === null || targetId === undefined || targetId === "") {
      toast.error(
        translate(
          "adminClients.missingClientId",
          "Missing client id. Please try again."
        )
      );
      closeDeleteDialog();
      return;
    }

    setLoadingDelete(targetId);
    try {
      await deleteClient(targetId);
      toast.success(
        translate("adminClients.deleteSuccess", "Client deleted successfully")
      );
      await refetch();
    } catch (error) {
      console.error("Error deleting client:", error);

      if (error.code === "PERMISSION_DENIED" || error.status === 403) {
        toast.error(
          error.message ||
            translate(
              "adminClients.deletePermissionDenied",
              "You don't have permission to delete clients. King admin access required."
            )
        );
      } else {
        toast.error(
          error.response?.data?.message ||
            translate(
              "adminClients.deleteFailed",
              "Failed to delete client. Please try again."
            )
        );
      }
    } finally {
      setLoadingDelete(null);
      pendingDeleteClientIdRef.current = null;
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  if (isError && !data) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          {translate(
            "adminClients.loadFailed",
            "Failed to load clients. Please try again."
          )}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 px-3 py-1.5 text-sm bg-primary text-white rounded-md"
        >
          {common.retry}
        </button>
      </div>
    );
  }

  const colSpan = isKingAdmin ? 8 : 7;
  const showNoSearchMatches =
    !showInitialLoading &&
    items.length === 0 &&
    Boolean(trimmedSearch) &&
    !hasNextPage;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="p-4 bg-white rounded-lg shadow-md shrink-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={translate(
                "adminClients.searchPlaceholder",
                "Search by name, email, or client ID..."
              )}
              className="w-full ps-8 pe-2 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={() => router.push(`${prefix}/clients/new`)}
            className="w-full sm:w-auto px-4 py-2 h-10 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md shrink-0"
          >
            <Plus size={18} className="shrink-0" />
            <span className="whitespace-nowrap">
              {translate("adminClients.createNew", "Create New Client")}
            </span>
          </button>
        </div>
      </div>

      <div
        ref={scrollRootRef}
        className="mt-4 flex-1 min-h-0 overflow-y-auto bg-white rounded-lg border border-gray-200"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-start px-4 py-3 font-medium text-gray-600">
                  {translate("adminClients.headers.clientId", "Client ID")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">
                  {translate("adminClients.headers.name", "Name")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">
                  {translate("adminClients.headers.email", "Email")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">
                  {translate("adminClients.headers.phone", "Phone")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">
                  {translate("adminClients.headers.type", "Type")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">
                  {translate("adminClients.headers.status", "Status")}
                </th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">
                  {translate("adminClients.headers.actions", "Actions")}
                </th>
                {isKingAdmin && (
                  <th className="text-start px-4 py-3 font-medium text-gray-600">
                    {translate("adminClients.headers.delete", "Delete")}
                  </th>
                )}
              </tr>
            </thead>
            {showInitialLoading ? (
              <TableSkeleton rows={10} />
            ) : showNoSearchMatches ? (
              <tbody>
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    {translate("common.noResultsFound", "No results found")}
                  </td>
                </tr>
              </tbody>
            ) : items.length === 0 ? (
              <tbody>
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    {translate("adminClients.noClients", "No clients found.")}
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-100">
                {items.map((client, index) => (
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
                    <td className="px-4 py-3 text-gray-600">
                      {client.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {client.phone_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {client.client_type || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        isActive={client.is_active}
                        translate={translate}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setEditingClient(client)}
                        className="px-3 py-1 text-xs font-medium text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors"
                      >
                        {translate("buttons.edit", "Edit")}
                      </button>
                    </td>
                    {isKingAdmin && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            openDeleteDialog(client.client_id ?? client.id)
                          }
                          disabled={
                            loadingDelete === (client.client_id ?? client.id)
                          }
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title={translate("buttons.delete", "Delete")}
                        >
                          {loadingDelete ===
                          (client.client_id ?? client.id) ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {initialListPaint && hasNextPage && (
          <>
            <div ref={sentinelRef} className="h-4 w-full shrink-0" aria-hidden />
            {isFetchingNextPage && (
              <div className="py-3 text-center text-xs text-gray-500 border-t border-gray-100">
                {common.loadingMore}
              </div>
            )}
            {!isFetchingNextPage && (
              <div className="p-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  className="w-full py-1.5 text-xs text-primary border border-gray-200 rounded hover:bg-gray-50"
                >
                  {common.loadMore}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {editingClient && (
        <EditClientDialog
          client={editingClient}
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
        />
      )}

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title={translate("adminClients.deleteTitle", "Delete Client")}
        message={translate(
          "adminClients.deleteMessage",
          "Are you sure you want to delete this client? This action cannot be undone and will delete all client data."
        )}
        confirmLabel={translate("buttons.delete", "Delete")}
        cancelLabel={translate("buttons.cancel", "Cancel")}
      />
    </div>
  );
}
