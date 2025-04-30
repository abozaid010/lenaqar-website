"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import PropertyDetailsModal from "@/components/dashbord/scomponent/AddUnit/PropertyDetailsModal";
import ClientsTablePagination from "./clients-table-pagination";
import {
  getClientActions,
  getClientRequirements,
} from "@/components/services/serviceFetching";
import ActionsModal from "./actions-modal";
import { useI18n } from "@/context/translate-api";

const ACTIONS_COLORS = {
  "Make a call": "text-blue-800",
  "Office visit": "text-yellow-800",
  "Property view": "text-teal-800",
  "Not interested": "text-gray-800",
  "Not qualified": "text-red-800",
  "Follow up later": "text-orange-800",
  "Missing Requirement": "text-purple-800",
  "No Action": "text-gray-400",
};

export default function ClientsTable({
  users,
  nextCursor,
  disableNext,
  disablePrev,
  previousCursor,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [rowSelection, setRowSelection] = useState([]);
  const [loadingClientActions, setLoadingClientActions] = useState(null);
  const [rowActions, setRowActions] = useState(null);
  const [openActionModal, setOpenActionModal] = useState(false);
  const [loadingRequirements, setLoadingRequirements] = useState(null);
  const [rowRequirements, setRowRequirements] = useState(null);
  const [openRequirementsModal, setOpenRequirementsModal] = useState(false);

  const toggleSelectAll = () => {
    if (rowSelection.length === users.length) {
      setRowSelection([]);
    } else {
      setRowSelection(users.map((user) => user.user_id));
    }
  };

  const toggleRowSelection = (user_id) => {
    if (rowSelection.includes(user_id)) {
      setRowSelection(rowSelection.filter((id) => id !== user_id));
    } else {
      setRowSelection([...rowSelection, user_id]);
    }
  };

  const isRowSelected = (user_id) => {
    return rowSelection.includes(user_id);
  };

  const handleclientAction = async (e, phone_number, user_id) => {
    e.stopPropagation();
    setLoadingClientActions(user_id);
    try {
      const actions = await getClientActions(user_id);
      setRowActions(actions);
      setOpenActionModal(true);
    } catch (error) {
      console.error("Error fetching actions:", error);
      setLoadingClientActions(null);
    }
  };

  const handleClientRequirements = async (e, phone_number, user_id) => {
    e.stopPropagation();
    setLoadingRequirements(user_id);
    try {
      const requirements = await getClientRequirements(phone_number);
      setRowRequirements({ ...requirements });
      setOpenRequirementsModal(true);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      setLoadingRequirements(null);
    }
  };

  return (
    <>
      {users?.length === 0 ? (
        <div>
          <div className="text-center font-medium text-xl mt-5 text-gray-400">
            {t.clientsTable.noClients}
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr className="text-left text-xs sm:text-sm font-medium text-gray-600">
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center w-6">
                    <input
                      type="checkbox"
                      checked={rowSelection?.length === users?.length}
                      onChange={toggleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center">
                    {t.clientsTable.headers.name}
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center hidden sm:table-cell">
                    {t.clientsTable.headers.userNumber}
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center">
                    {t.clientsTable.headers.date}
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center hidden md:table-cell">
                    {t.clientsTable.headers.requirements}
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center">
                    {t.clientsTable.headers.messageCount}
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center">
                    {t.clientsTable.headers.action}
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {users?.map((user) => {
                  let lastActivity = t.clientsTable.lastActivity.na;
                  try {
                    if (user.updated_at) {
                      const dateObj = new Date(user.updated_at);
                      if (!isNaN(dateObj.getTime())) {
                        lastActivity = dateObj.toISOString().split("T")[0];
                      }
                    }
                  } catch (error) {
                    console.error("Invalid date format:", user.updated_at);
                  }

                  return (
                    <tr
                      onClick={() => router.push(`/dashboard/chat/${user.user_id}`)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        router.push(`/dashboard/chat/${user.user_id}`)
                      }
                      role="button"
                      tabIndex={0}
                      key={user.user_id}
                      className={`hover:bg-gray-50 transition-colors text-xs sm:text-sm text-center ${
                        isRowSelected(user.user_id) && "bg-stone-100"
                      } ${loadingClientActions ? "pointer-events-none" : ""}`}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={rowSelection.includes(user.user_id)}
                          onChange={() => toggleRowSelection(user.user_id)}
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-pointer"
                        />
                      </td>

                      <td className="px-2 py-1 sm:py-2 font-medium text-gray-900">
                        {user.name || t.clientsTable.newLead}
                      </td>

                      <td className="px-2 py-1 sm:py-2 text-gray-600 hidden sm:table-cell">
                        {user.phone_number || ""}
                      </td>

                      <td className="px-2 py-1 sm:py-2 text-gray-600">
                        {lastActivity}
                      </td>

                      <td
                        className={`px-2 py-1 sm:py-2 hidden md:flex justify-center items-center ${
                          user.requirement_name !== t.clientsTable.notDefined
                            ? "text-blue-600 cursor-pointer hover:underline"
                            : "pointer-events-none text-gray-500"
                        }`}
                        onClick={(e) => {
                          if (user.requirement_name !== t.clientsTable.notDefined) {
                            handleClientRequirements(e, user.user_id, user.user_id);
                          }
                        }}
                      >
                        {loadingRequirements === user.user_id ? (
                          <div>
                            <Loader2
                              size={16}
                              className="animate-spin text-center"
                            />
                          </div>
                        ) : (
                          <span className="line-clamp-1">
                            {user.requirement_name}
                          </span>
                        )}
                      </td>

                      <td className="px-2 py-1 sm:py-2 text-center font-medium">
                        {user.messages_count || 0}
                      </td>

                      <td
                        className={`px-2 py-1 sm:py-2 text-center font-bold underline cursor-pointer flex items-center justify-center ${
                          ACTIONS_COLORS[user.last_action]
                        }`}
                        onClick={(e) =>
                          handleclientAction(e, user.phone_number, user.user_id)
                        }
                      >
                        {loadingClientActions === user.user_id &&
                        !openActionModal ? (
                          <div>
                            <Loader2
                              size={16}
                              className="animate-spin text-center"
                            />
                          </div>
                        ) : (
                          <span className="line-clamp-1">
                            {user.last_action}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col mt-4 gap-3">
            <div className="flex justify-between items-center flex-row-reverse">
              <ClientsTablePagination
                nextCursor={nextCursor}
                disableNext={disableNext}
                previousCursor={previousCursor}
                disablePrev={disablePrev}
              />

              {rowSelection.length > 0 && (
                <button className="bg-primary hover:opacity-95 cursor-pointer text-white py-1.5 rounded-md px-5">
                  {t.clientsTable.actions.addAction.replace(
                    "{count}",
                    rowSelection.length
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {openActionModal && (
        <ActionsModal
          actions={rowActions}
          userId={loadingClientActions}
          onClose={() => {
            setOpenActionModal(false);
            setLoadingClientActions(null);
          }}
        />
      )}

      {openRequirementsModal && (
        <PropertyDetailsModal
          onClose={() => {
            setOpenRequirementsModal(false);
            setLoadingRequirements(null);
          }}
          property={rowRequirements}
        />
      )}
    </>
  );
}