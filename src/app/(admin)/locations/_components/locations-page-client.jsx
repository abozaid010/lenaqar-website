"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useI18n } from "@/hooks/useI18n";
import {
  useApproveLocation,
  useCreateLocation,
  useDeleteLocation,
  useLocationRoots,
  usePendingLocations,
  useRejectLocation,
  useUpdateLocationAliases,
} from "@/hooks/use-market-index";
import { locationLabel } from "./location-label";
import LocationTree from "./location-tree";
import PendingQueue from "./pending-queue";

const dialogLoading = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden />
  </div>
);

const LocationFormDialog = dynamic(() => import("./location-form-dialog"), {
  ssr: false,
  loading: dialogLoading,
});

const AliasesDialog = dynamic(() => import("./aliases-dialog"), {
  ssr: false,
  loading: dialogLoading,
});

const TABS = [
  { key: "tree", labelKey: "locations.tabs.tree" },
  { key: "pending", labelKey: "locations.tabs.pending" },
];

function apiErrorMessage(err, fallback) {
  return err?.message || err?.error_message || fallback;
}

export default function LocationsPageClient({
  unavailable = false,
  initialRoots = null,
  initialPending = null,
}) {
  const { translate, locale } = useI18n();
  const [tab, setTab] = useState("tree");
  const [createState, setCreateState] = useState(null);
  const [aliasesNode, setAliasesNode] = useState(null);
  const [deleteNode, setDeleteNode] = useState(null);
  const [busyPendingId, setBusyPendingId] = useState(null);

  const rootsQuery = useLocationRoots(true, initialRoots || undefined);
  const pendingQuery = usePendingLocations(
    tab === "pending",
    initialPending || undefined
  );

  const createMutation = useCreateLocation();
  const aliasesMutation = useUpdateLocationAliases();
  const deleteMutation = useDeleteLocation();
  const approveMutation = useApproveLocation();
  const rejectMutation = useRejectLocation();

  if (unavailable) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-lg font-semibold text-gray-900">
          {translate("locations.unavailable.title")}
        </h1>
        <p className="max-w-md text-sm text-gray-600">
          {translate("locations.unavailable.message")}
        </p>
      </div>
    );
  }

  const pendingCount = pendingQuery.data?.count ?? initialPending?.count ?? 0;

  const openAddCity = () => setCreateState({ level: "city", parent: null });
  const openAddChild = (parent, level) => setCreateState({ level, parent });

  const handleCreate = async (body) => {
    try {
      await createMutation.mutateAsync(body);
      toast.success(translate("locations.toasts.created"));
      setCreateState(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, translate("locations.errors.createFailed")));
    }
  };

  const handleAliasesSave = async (aliases) => {
    if (!aliasesNode?.id) return;
    try {
      await aliasesMutation.mutateAsync({
        locationId: aliasesNode.id,
        aliases,
      });
      toast.success(translate("locations.toasts.aliasesUpdated"));
      setAliasesNode(null);
    } catch (err) {
      toast.error(
        apiErrorMessage(err, translate("locations.errors.aliasesFailed"))
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteNode?.id) return;
    const hardDeleteApproved = deleteNode.status === "approved";
    try {
      await deleteMutation.mutateAsync({
        locationId: deleteNode.id,
        hardDeleteApproved,
        parentId: deleteNode.parent_id,
      });
      toast.success(translate("locations.toasts.deleted"));
      setDeleteNode(null);
    } catch (err) {
      toast.error(
        apiErrorMessage(err, translate("locations.errors.deleteFailed"))
      );
    }
  };

  const handleApprove = async (node) => {
    setBusyPendingId(node.id);
    try {
      await approveMutation.mutateAsync(node.id);
      toast.success(translate("locations.toasts.approved"));
    } catch (err) {
      toast.error(
        apiErrorMessage(err, translate("locations.errors.approveFailed"))
      );
    } finally {
      setBusyPendingId(null);
    }
  };

  const handleReject = async (node) => {
    setBusyPendingId(node.id);
    try {
      await rejectMutation.mutateAsync(node.id);
      toast.success(translate("locations.toasts.rejected"));
    } catch (err) {
      toast.error(
        apiErrorMessage(err, translate("locations.errors.rejectFailed"))
      );
    } finally {
      setBusyPendingId(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {translate("locations.title")}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {translate("locations.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={openAddCity}
          className="inline-flex items-center justify-center gap-2 self-end rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {translate("locations.actions.addCity")}
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-200 bg-white px-4">
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`relative px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {translate(item.labelKey)}
              {item.key === "pending" && pendingCount > 0 ? (
                <span className="ms-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs text-primary">
                  {pendingCount}
                </span>
              ) : null}
              {active ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "tree" ? (
          rootsQuery.isError ? (
            <div className="py-16 text-center text-sm text-red-600">
              {apiErrorMessage(
                rootsQuery.error,
                translate("locations.errors.loadFailed")
              )}
            </div>
          ) : (
            <LocationTree
              roots={rootsQuery.data}
              isLoading={rootsQuery.isLoading && !rootsQuery.data}
              onAddChild={openAddChild}
              onEditAliases={setAliasesNode}
              onDelete={setDeleteNode}
            />
          )
        ) : pendingQuery.isError ? (
          <div className="py-16 text-center text-sm text-red-600">
            {apiErrorMessage(
              pendingQuery.error,
              translate("locations.errors.loadFailed")
            )}
          </div>
        ) : (
          <PendingQueue
            pending={pendingQuery.data}
            isLoading={pendingQuery.isLoading && !pendingQuery.data}
            onApprove={handleApprove}
            onReject={handleReject}
            busyId={busyPendingId}
          />
        )}
      </div>

      {createState ? (
        <LocationFormDialog
          isOpen
          onClose={() => setCreateState(null)}
          onSubmit={handleCreate}
          level={createState.level}
          parent={createState.parent}
          submitting={createMutation.isPending}
        />
      ) : null}

      {aliasesNode ? (
        <AliasesDialog
          isOpen
          onClose={() => setAliasesNode(null)}
          onSubmit={handleAliasesSave}
          location={aliasesNode}
          submitting={aliasesMutation.isPending}
        />
      ) : null}

      <DeleteConfirmDialog
        isOpen={!!deleteNode}
        onClose={() => setDeleteNode(null)}
        onConfirm={handleDeleteConfirm}
        title={translate("locations.delete.title")}
        message={translate("locations.delete.message").replace(
          "{name}",
          locationLabel(deleteNode, locale)
        )}
        confirmLabel={
          deleteMutation.isPending
            ? translate("common.loading")
            : translate("common.delete")
        }
        cancelLabel={translate("common.cancel")}
      />

      {deleteMutation.isPending ? (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/10">
          <LoadingSpinner />
        </div>
      ) : null}
    </div>
  );
}
