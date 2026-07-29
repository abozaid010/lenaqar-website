"use client";

import PropertyDetailsModal from "@/components/ui/property-requirements-modal";
import { useI18n } from "@/context/translate-api";
import { getBuildingTypes } from "@/data/constants";
import {
  ACTIONS_COLORS,
  getActionLabel,
  normalizeLastAction,
} from "@/utils/actions";
import { getClientActions, getClientRequirements, deleteClient } from "@/utils/api";
import { handleOpenWhatsApp, handleCopyPhoneNumber } from "@/utils/phone-utils";
import { formatPhoneForDisplay, phoneToE164 } from "@/components/phone/phone-utils";
import { formatDateTimeAmPmShort } from "@/utils/formateDate";
import { BellDot, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import ActionsModal from "./actions-modal";
import ClientsTablePagination from "./clients-table-pagination";
import EmptyStateVideo from "@/components/ui/empty-state-video";

export default function ClientsTable({ users, pagination }) {
  const { t, locale, translate } = useI18n();
  const router = useRouter();

  // Get building types with translations from the active locale only
  const BUILDING_TYPES = useMemo(() => {
    const slice = { buildingTypes: translate("buildingTypes", {}) };
    return getBuildingTypes({ en: slice, ar: slice });
  }, [translate]);

  const [rowSelection, setRowSelection] = useState([]);
  const [loadingClientActions, setLoadingClientActions] = useState(null);
  const [rowActions, setRowActions] = useState(null);
  const [actionUser, setActionUser] = useState(null);
  const [openActionModal, setOpenActionModal] = useState(false);
  const [loadingRequirements, setLoadingRequirements] = useState(null);
  const [rowRequirements, setRowRequirements] = useState(null);
  const [openRequirementsModal, setOpenRequirementsModal] = useState(false);
  const [localUsers, setLocalUsers] = useState(users);
  const [loadingDelete, setLoadingDelete] = useState(null);

  useEffect(() => {
    if (users) {
      setLocalUsers(users);
    }
  }, [users]);

  const toggleSelectAll = () => {
    if (rowSelection.length === localUsers.length) {
      setRowSelection([]);
    } else {
      setRowSelection(localUsers.map((user) => user.user_id));
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

  const handleclientAction = async (e, user) => {
    e.stopPropagation();
    const user_id = typeof user === "string" ? user : user?.user_id;
    setLoadingClientActions(user_id);
    setActionUser(
      typeof user === "string"
        ? { user_id, name: "", phone_number: "" }
        : {
            user_id: user?.user_id,
            name: user?.name || "",
            phone_number: user?.phone_number || "",
          }
    );
    try {
      const actions = await getClientActions(user_id);
      setRowActions(actions);
      setOpenActionModal(true);
    } catch (error) {
      console.error("Error fetching actions:", error?.message ?? error);
      setLoadingClientActions(null);
      setActionUser(null);
    }
  };

  const handleClientRequirements = async (e, user_id, name, phone) => {
    e.stopPropagation();
    setLoadingRequirements(user_id);
    try {
      const requirements = await getClientRequirements(user_id);
      setRowRequirements({ ...requirements, name: name, phone: phone });
      setOpenRequirementsModal(true);
    } catch (error) {
      console.error("Error fetching requirements:", error?.message ?? error);
      setLoadingRequirements(null);
    }
  };

  const handleActionUpdate = (userId, newAction) => {
    setLocalUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.user_id === userId ? { ...user, last_action: newAction } : user
      )
    );
  };

  // Wrapper for copy phone number with toast notifications
  const handleCopyPhoneNumberWithToast = async (e, phoneNumber) => {
    await handleCopyPhoneNumber(
      e,
      phoneNumber,
      () => toast.success(t?.clientsTable?.phoneCopied),
      () => toast.error(t?.clientsTable?.phoneCopyFailed)
    );

  };

  const handleDelete = async (e, user_id) => {
    e.stopPropagation();
    
    // Confirm before delete
    const confirmed = window.confirm(
      t?.clientsTable?.deleteConfirm || "Are you sure you want to delete this client? This action cannot be undone."
    );
    if (!confirmed) return;

    setLoadingDelete(user_id);
    try {
      await deleteClient(user_id);
      toast.success(t?.clientsTable?.deleteSuccess || "Client deleted successfully");
      // Remove the deleted user from local state
      setLocalUsers((prev) => prev.filter((user) => user.user_id !== user_id));
    } catch (error) {
      console.error("Error deleting client:", error?.message ?? error);
      toast.error(t?.clientsTable?.deleteError || "Failed to delete client");
    } finally {
      setLoadingDelete(null);
    }
  };

  return (
    <>
      {localUsers?.length === 0 ? (
        // <div className="text-center font-medium text-xl mt-5 text-gray-400">
        //   {t.clientsTable.noClients}
        // </div>
        <EmptyStateVideo variant="dashboard" autoPlay showControls loop />
      ) : (
        <>
          <div className="border border-gray-200 sm:rounded-lg scroll-snap-x-mandatory ">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr className="text-left text-xs sm:text-sm font-medium text-gray-600">
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center w-6 ">
                    <input
                      type="checkbox"
                      checked={rowSelection?.length === localUsers?.length}
                      onChange={toggleSelectAll}
                      className="cursor-pointer no-print"
                    />
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap max-w-[80px]">
                    {t.clientsTable.headers.name}
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap max-w-[120px]">
                    {t.clientsTable.headers.userNumber}
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap max-w-[120px]">
                    {t.clientsTable.headers.date}
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap max-w-[120px]">
                    {t.clientsTable.headers.requirements}
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap hidden md:table-cell max-w-[100px]">
                    {t.clientsTable.headers.messageCount}
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap max-w-[120px]">
                    {t.clientsTable.headers.campaign}
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap max-w-[120px]">
                    {t.clientsTable.headers.action}
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap max-w-[60px]">
                    {t.buttons?.delete || "Delete"}
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {localUsers?.map((user) => {
                  let lastActivity = t.clientsTable.lastActivity.na;
                  try {
                    const formatted = formatDateTimeAmPmShort(user.updated_at);
                    if (formatted) lastActivity = formatted;
                  } catch (error) {
                    console.error("Invalid date format:", user.updated_at);
                  }

                  return (
                    <tr
                      onClick={() => router.push(`/dashboard/${user.user_id}`)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        router.push(`/dashboard/${user.user_id}`)
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
                          className="cursor-pointer no-print"
                        />
                      </td>

                      <td className="px-2 py-2 font-medium text-gray-900 whitespace-nowrap max-w-[150px] truncate">
                        {user.name || t('clientsTable.newLead')}
                      </td>

                      <td className="px-2 py-2 text-gray-600 whitespace-nowrap max-w-[120px]">
                        {user.phone_number ? (
                          <div className="flex items-center justify-between gap-2 min-w-[140px]">
                            <span
                              onClick={(e) =>
                                handleCopyPhoneNumberWithToast(
                                  e,
                                  phoneToE164(user.phone_number, "EG") || user.phone_number,
                                )
                              }
                              className="cursor-pointer hover:text-primary transition-colors flex-1 text-left truncate"
                              title={t('clientsTable.clickToCopy')}
                            >
                              {formatPhoneForDisplay(user.phone_number, "EG") || user.phone_number}
                            </span>
                            <button
                              onClick={(e) =>
                                handleOpenWhatsApp(
                                  e,
                                  phoneToE164(user.phone_number, "EG") || user.phone_number,
                                )
                              }
                              className="icon-btn h-6 w-6 rounded-full bg-green-500 shadow transition-all duration-200 hover:bg-green-600"
                              title={t('clientsTable.openWhatsApp')}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 text-white"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          t('clientsTable.newLead')
                        )}

                      </td>

                      <td className="px-2 py-2 text-gray-600 whitespace-nowrap max-w-[120px] truncate">
                        {lastActivity}
                      </td>

                      <td
                        className={`px-2 py-2 whitespace-nowrap max-w-[120px] truncate ${
                          user.requirement_name &&
                          user.requirement_name !== "Not defined"
                            ? "text-primary/90 cursor-pointer hover:underline font-semibold"
                            : "pointer-events-none text-gray-500"
                        }`}
                        onClick={(e) => {
                          if (
                            user.requirement_name &&
                            user.requirement_name !== "Not defined"
                          ) {
                            handleClientRequirements(
                              e,
                              user.user_id,
                              user.name,
                              user.phone_number
                            );
                          }
                        }}
                      >
                        {loadingRequirements === user.user_id ? (
                          <div className="flex items-center justify-center">
                            <Loader2
                              size={16}
                              className="animate-spin text-center"
                            />
                          </div>
                        ) : (
                          <span className="line-clamp-1">
                            {(user.requirement_name &&
                              BUILDING_TYPES.find(
                                (type) => type.value === user.requirement_name
                              )?.[locale === "ar" ? "ar_label" : "en_label"]) ||
                              user.requirement_name}
                          </span>
                        )}
                      </td>

                      <td className="px-2 py-2 text-center font-medium whitespace-nowrap hidden md:table-cell max-w-[100px] truncate">
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-flex items-center min-w-[24px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-xs font-semibold">
                            {user.messages_count || 0}
                          </span>
                          {user?.unread_messages_count > 0 && (
                            <div
                              className="inline-flex items-center justify-center gap-1 min-w-[24px] px-2 py-0.5 rounded bg-red-500 text-white text-xs font-semibold"
                              title={
                                t.clientsTable.headers.unreadMessages ||
                                "Unread messages"
                              }
                            >
                              <span>{user.unread_messages_count}</span>
                              <BellDot size={14} />
                            </div>
                          )}
                        </span>
                      </td>

                      <td className="px-2 py-2 text-center whitespace-nowrap max-w-[120px] truncate">
                        {user?.campaign_ids && user.campaign_ids.length > 0 ? (
                          <div className="inline-flex flex-col items-center gap-1 justify-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                              {user.campaign_ids[0]}
                            </span>
                            {user.campaign_ids.length > 1 && (
                              <div className="inline-flex items-center gap-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                                  {user.campaign_ids[1]}
                                </span>
                                {user.campaign_ids.length > 2 && (
                                  <div className="relative group">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold cursor-help">
                                      +{user.campaign_ids.length - 2}
                                    </span>
                                    <div className="absolute z-50 invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-2 px-3 bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap shadow-lg">
                                      <div className="flex flex-col gap-1">
                                        {user.campaign_ids
                                          .slice(2)
                                          .map((campaign, index) => (
                                            <span key={index}>{campaign}</span>
                                          ))}
                                      </div>
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                        <div className="border-4 border-transparent border-t-gray-900"></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>

                      <td
                        className={`px-2 py-2 text-center font-bold underline cursor-pointer whitespace-nowrap max-w-[120px] truncate ${
                          ACTIONS_COLORS[normalizeLastAction(user.last_action)] ||
                          "text-gray-400"
                        }`}
                        onClick={(e) => handleclientAction(e, user)}
                      >
                        {loadingClientActions === user.user_id &&
                        !openActionModal ? (
                          <div className="flex items-center justify-center">
                            <Loader2
                              size={16}
                              className="animate-spin text-center"
                            />
                          </div>
                        ) : (
                          <span className="line-clamp-1">
                            {getActionLabel(user.last_action, translate)}
                          </span>
                        )}
                      </td>

                      <td className="px-2 py-2 text-center whitespace-nowrap max-w-[60px]">
                        <button
                          onClick={(e) => handleDelete(e, user.user_id)}
                          disabled={loadingDelete === user.user_id}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title={t.buttons?.delete || "Delete"}
                        >
                          {loadingDelete === user.user_id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col mt-4 gap-3  no-print">
            <div className="flex justify-between items-center flex-row-reverse">
              <ClientsTablePagination
                nextCursor={pagination?.next_cursor}
                disableNext={!pagination?.has_more_next}
                previousCursor={pagination?.prev_cursor}
                disablePrev={!pagination?.has_more_prev}
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
          userId={actionUser?.user_id || loadingClientActions}
          phoneNumber={actionUser?.phone_number || ""}
          name={actionUser?.name || ""}
          onClose={() => {
            setOpenActionModal(false);
            setLoadingClientActions(null);
            setActionUser(null);
          }}
          onActionUpdate={handleActionUpdate}
          ownerType={actionUser?.owner_type || null}
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
