"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClients } from "@/hooks/use-clients-data";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import EditClientDialog from "./EditClientDialog";

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

  const { items, pagination, isLoading, isError } = useClients(page);

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          type="button"
          onClick={() => router.push(`${prefix}/clients/new`)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Create New Client
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No clients found.
                  </td>
                </tr>
              ) : (
                items.map((client) => (
                  <tr key={client.client_id} className="hover:bg-gray-50 transition-colors">
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
    </div>
  );
}
