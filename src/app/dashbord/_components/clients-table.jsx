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
      setRowSelection(users.map((user) => user.phoneNumber));
    }
  };
  const toggleRowSelection = (phoneNumber) => {
    if (rowSelection.includes(phoneNumber)) {
      setRowSelection(rowSelection.filter((number) => number !== phoneNumber));
    } else {
      setRowSelection([...rowSelection, phoneNumber]);
    }
  };
  const isRowSelected = (phoneNumber) => {
    return rowSelection.includes(phoneNumber);
  };

  const handleclientAction = async (e, phoneNumber) => {
    e.stopPropagation();

    // Set loading state for the specific row
    setLoadingClientActions(phoneNumber);

    try {
      const actions = await getClientActions(phoneNumber);

      setRowActions(actions);
      setOpenActionModal(true);
    } catch (error) {
      console.error("Error fetching actions:", error);
      setLoadingClientActions(null);
    }
  };

  const handleClientRequirements = async (
    e,
    phoneNumber,
    purchaseProbability
  ) => {
    e.stopPropagation();

    // Set loading state for the specific row
    setLoadingRequirements(phoneNumber);

    try {
      const requirements = await getClientRequirements(phoneNumber);
      setRowRequirements({ ...requirements, purchaseProbability });
      setOpenRequirementsModal(true);
    } catch (error) {
      console.error("Error fetching actions:", error); // Handle errors
      setLoadingClientActions(null);
    }
  };

  return (
    <>
      {users.length === 0 ? (
        <div>
          <div className="text-center font-medium text-xl mt-5 text-gray-400">
            No clients found.
          </div>
        </div>
      ) : (
        <>
          <div className=" overflow-x-auto border border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr className="text-left text-xs sm:text-sm font-medium text-gray-600">
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center w-6">
                    <input
                      type="checkbox"
                      checked={rowSelection.length === users.length}
                      onChange={toggleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center">Name</th>
                  <th className="px-2 sm:px-4 py-2 text-center hidden sm:table-cell">
                    User Number
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center">Date</th>
                  <th className="px-2 sm:px-4 py-2 text-center hidden md:table-cell">
                    Requirements
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center">
                    Message Count
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const lastActivity = new Date(user.date)
                    .toISOString()
                    .split("T")[0];

                  return (
                    <tr
                      onClick={() =>
                        router.push(`/dashbord/chat/${user.phoneNumber}`)
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        router.push(`/dashbord/chat/${user.phoneNumber}`)
                      }
                      role="button"
                      tabIndex={0}
                      key={user.phoneNumber}
                      className={`hover:bg-gray-50 transition-colors text-xs sm:text-sm text-center ${
                        isRowSelected(user.phoneNumber) && "bg-stone-100"
                      } ${loadingClientActions ? "pointer-events-none" : ""}`}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={rowSelection.includes(user.phoneNumber)}
                          onChange={() => toggleRowSelection(user.phoneNumber)}
                          onClick={(e) => e.stopPropagation()} // Prevent row navigation on click
                          className="cursor-pointer"
                        />
                      </td>

                      <td className="px-2 py-1 sm:py-2 font-medium text-gray-900">
                        {user.phoneNumber}
                      </td>

                      <td className="px-2 py-1 sm:py-2 text-gray-600 hidden sm:table-cell">
                        {user.phoneNumber}
                      </td>

                      <td className="px-2 py-1 sm:py-2 text-gray-600">
                        {lastActivity}
                      </td>

                      <td
                        className={`px-2 py-1 sm:py-2 hidden md:flex justify-center items-center ${user.requirements !== "Not Specified" ? "text-blue-600 cursor-pointer hover:underline" : "pointer-events-none text-gray-500"}`}
                        onClick={(e) =>
                          handleClientRequirements(
                            e,
                            user.phoneNumber,
                            user.profile
                          )
                        }
                      >
                        {loadingRequirements === user.phoneNumber &&
                        !openRequirementsModal ? (
                          <div>
                            <Loader2
                              size={16}
                              className="animate-spin text-center"
                            />
                          </div>
                        ) : (
                          <span className="line-clamp-1">
                            {user.requirements}
                          </span>
                        )}
                      </td>

                      <td className="px-2 py-1 sm:py-2 text-center font-medium">
                        {user.messages_count || 0}
                      </td>

                      <td
                        className={`px-2 py-1 sm:py-2 text-center font-bold underline cursor-pointer flex items-center justify-center ${ACTIONS_COLORS[user.actions]}`}
                        onClick={(e) => handleclientAction(e, user.phoneNumber)}
                      >
                        {loadingClientActions === user.phoneNumber &&
                        !openActionModal ? (
                          <div>
                            <Loader2
                              size={16}
                              className="animate-spin text-center"
                            />
                          </div>
                        ) : (
                          <span className="line-clamp-1">{user.actions}</span>
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

              {/* TODO: This button should open a modal to add action to the selected rows */}
              {rowSelection.length > 0 && (
                <button className="bg-[#1e3a8a] hover:opacity-95 cursor-pointer text-white py-1.5 rounded-md px-5">
                  Add Action to {rowSelection.length} client(s)
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Actions Modal  */}
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
      {/* Property Details Modal */}
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
