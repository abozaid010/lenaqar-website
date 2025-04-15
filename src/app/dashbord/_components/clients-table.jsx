"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import axios from "axios";
import axiosInstance from "@/utils/axiosInstance";
import PropertyDetailsModal from "@/components/dashbord/scomponent/AddUnit/PropertyDetailsModal";
import ClientsTablePagination from "./clients-table-pagination";
import { getClientActions } from "@/components/services/serviceFetching";
import ActionsModal from "./actions-modal";

const propertyDetails = {
  "Three Bedroom": {
    title: "Three Bedroom Apartment in Madinaty",
    buildingType: "Apartment",
    landArea: "200m²",
    floor: "3rd Floor",
    roomsCount: "3",
    bathroomCount: "2",
    view: "Garden View",
    gardenSize: "120m²",
    finishing: "Fully Finished",
    developer: "Dream House",
    downPayment: "50,000 EGP",
    deliveryYear: "2026",
    totalPrice: "1,500,000 EGP",
    contactName: "Dream House Agent",
    lastUpdate: "01-04-2025",
    forRentSale: "Rent",
  },
  Apartment: {
    title: "Modern Apartment in New Cairo",
    buildingType: "Apartment",
    landArea: "150m²",
    floor: "5th Floor",
    roomsCount: "2",
    bathroomCount: "1",
    view: "City View",
    gardenSize: "0m²",
    finishing: "Semi Finished",
    developer: "SODIC",
    downPayment: "300,000 EGP",
    deliveryYear: "2025",
    totalPrice: "2,000,000 EGP",
    contactName: "SODIC Development",
    lastUpdate: "28-03-2025",
    forRentSale: "Sale",
  },
  Townhouse: {
    title: "Luxury Townhouse in Sheikh Zayed",
    buildingType: "Townhouse",
    landArea: "250m²",
    floor: "2 Floors",
    roomsCount: "4",
    bathroomCount: "3",
    view: "Garden View",
    gardenSize: "100m²",
    finishing: "Fully Finished",
    developer: "Palm Hills",
    downPayment: "1,000,000 EGP",
    deliveryYear: "2024",
    totalPrice: "5,000,000 EGP",
    contactName: "Palm Hills Developments",
    lastUpdate: "15-03-2025",
    forRentSale: "Sale",
  },
  Villa: {
    title: "Spacious Villa in Katameya Heights",
    buildingType: "Villa",
    landArea: "500m²",
    floor: "2 Floors",
    roomsCount: "5",
    bathroomCount: "4",
    view: "Golf Course",
    gardenSize: "300m²",
    finishing: "Fully Finished",
    developer: "Emaar",
    downPayment: "2,000,000 EGP",
    deliveryYear: "2023",
    totalPrice: "10,000,000 EGP",
    contactName: "Emaar Properties",
    lastUpdate: "20-03-2025",
    forRentSale: "Sale",
  },
};

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

export default function ClientsTable({ users, nextCursor, disableNext }) {
  const router = useRouter();
  const [rowSelection, setRowSelection] = useState([]);

  const [loadingClientActions, setLoadingClientActions] = useState(null);
  const [rowActions, setRowActions] = useState([]);
  const [openActionModal, setOpenActionModal] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isOpenmodle, setIsOpenmodle] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [SelectedAction, setSelectedAction] = useState(null);

  const [action, setaction] = useState(null);

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

  const handleclientAction = async (e, user) => {
    e.stopPropagation();
    // Set loading state for the specific row
    setLoadingClientActions(user.phoneNumber);

    try {
      const actions = await getClientActions(user.phoneNumber);

      console.log("Actions:", actions); // Log the actions for debugging
      setRowActions(actions); // Store the actions in state
      setOpenActionModal(true); // Open the modal to display actions
    } catch (error) {
      console.error("Error fetching actions:", error); // Handle errors
      setLoadingClientActions(null);
    }
  };

  const [loading, setLoading] = useState(false);
  const [isOpenn, setIsOpenn] = useState(false);

  // Function to open property details modal
  const openPropertyDetails = (requirement, score) => {
    const property =
      propertyDetails[requirement] || propertyDetails["Apartment"]; // Fallback
    property["purchaseProbability"] = score;
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const actionidd = `${selectedId?.phoneNumber}_${selectedId?.client_id}`;

  const formikinput = useFormik({
    enableReinitialize: true, // This allows the form to update when initialValues change
    initialValues: {
      client_id: action?.client_id || "",
      user_id: action?.user_id || "",
      created_at: action?.created_at || "",
      preferred_time: action?.preferred_time || "",
      description: action?.description || "",
      action: action?.action || "",
      comment: "",
    },

    onSubmit: async (values) => {
      const payload = {
        client_id: values.client_id,
        user_id: values.user_id,
        created_at: values.created_at,
        preferred_time: values.preferred_time,
        description: values.description,
        action: values.action,
        comment: "",
        actions_history: [
          {
            user: values.user_id || "current_user_id",
            comment: values.comment,
            created_at: new Date().toISOString(),
            action: values.action,
          },
        ],
      };

      try {
        setLoading(true);
        const response = await axiosInstance.put(
          `/actions/${actionidd}`,
          payload,
          {}
        );
        setIsOpenmodle(false);
        toast.success("Action updated successfully!");
      } catch (error) {
        toast.error(error?.message || "Something went wrong");
        console.error(error);
      } finally {
        setLoading(false);
        formikinput.resetForm();
      }
    },
  });

  const initialCreatedAt = useMemo(() => {
    return action?.created_at || new Date().toISOString();
  }, [action?.created_at]);

  const formikaction = useFormik({
    enableReinitialize: true, // This allows the form to update when initialValues change
    initialValues: {
      client_id: SelectedAction?.user?.client_id || "",
      user_id: SelectedAction?.user?.phoneNumber || "",
      created_at: initialCreatedAt,
      description: action?.description || "",
      action: action?.action || "",
    },

    onSubmit: async (values) => {
      const payload = {
        client_id: values.client_id,
        user_id: values.user_id,
        created_at: values.created_at,
        action: values.action,
        description: values.description,
      };

      try {
        setLoading(true);
        const response = await axios.post(
          `https://api.lenaai.net/action/`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Action updated successfully!");
        setIsOpenn(false);
      } catch (error) {
        toast.error(error?.message || "Something went wrong");
        console.error(error);
      } finally {
        setLoading(false);
        formikaction.resetForm();
      }
    },
  });

  useEffect(() => {
    if (!selectedId) return;

    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://api.lenaai.net/action/${actionidd}`
        );

        setaction(response?.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [selectedId]);

  return (
    <>
      {/* Clients Table */}
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
                  const requirements =
                    user.requirements?.userBuildingType?.[0] || "Not specified";

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
                        className={`px-2 py-1 sm:py-2 hidden md:table-cell ${user.requirements !== "Not Specified" ? "text-blue-600 cursor-pointer hover:underline" : "pointer-events-none text-gray-500"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openPropertyDetails(requirements, 50);
                        }}
                      >
                        <span className="line-clamp-1">
                          {user.requirements !== "Not Specified"
                            ? user.requirements
                            : "Not Specified"}
                        </span>
                      </td>

                      <td className="px-2 py-1 sm:py-2 text-center font-medium">
                        {user.messages_count || 0}
                      </td>

                      <td
                        className={`px-2 py-1 sm:py-2 text-center font-bold underline cursor-pointer flex items-center justify-center ${ACTIONS_COLORS[user.actions]}`}
                        onClick={(e) => handleclientAction(e, user)}
                      >
                        {loadingClientActions === user.phoneNumber &&
                        !openActionModal ? (
                          <div>
                            <Loader2
                              size={18}
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
      {/* TODO: Modale should not be here.. */}
      {/* Modle in Action  */}
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
      {/* TODO: Modale should not be here.. */}
      {/* Modle Create Action */}
      {isOpenn && (
        <div
          id="hs-basic-modal"
          className="hs-overlay size-full fixed top-0 start-0 z-80 opacity-100 overflow-x-hidden transition-all overflow-y-auto pointer-events-auto bg-black/50"
          role="dialog"
          tabIndex="-1"
          aria-labelledby="hs-basic-modal-label"
        >
          <div className="sm:max-w-lg sm:w-full m-3 sm:mx-auto">
            <div className="flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl pointer-events-auto dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-neutral-700/70">
              <div className="flex justify-between items-center py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
                <h3
                  id="hs-basic-modal-label"
                  className="font-bold text-gray-800 dark:text-white"
                >
                  Create Action
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpenn(false)}
                  className="size-8 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-400 dark:focus:bg-neutral-600"
                  aria-label="Close"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="shrink-0 size-4"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <form
                  className="max-w- mx-auto"
                  onSubmit={formikaction.handleSubmit}
                >
                  <label
                    htmlFor="action"
                    className="block mb-2 mt-2  text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Action
                  </label>
                  <select
                    id="action"
                    name="action"
                    onChange={formikaction.handleChange}
                    value={formikaction.values.action}
                    className="bg-gray-100 mx-0  border-gray-700 border-0 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3.5 px-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required
                  >
                    <option value="">Select an option</option>
                    <option value="Make a call">Make a call</option>
                    <option value="Office visit">office visit</option>
                    <option value="Property view">property view</option>
                    <option value="Not interested">Not interested</option>
                    <option value="Not qualified">Not qualified</option>
                    <option value="Follow up later">Follow up later</option>
                    <option value="Missing Requirement">
                      Missing Requirement
                    </option>
                  </select>

                  <div className="mt-8">
                    <label
                      htmlFor="description"
                      className="block mb-2 font-bold text-sm text-gray-900 dark:text-white"
                    >
                      Description
                    </label>
                    <input
                      type="text"
                      id="description"
                      name="description"
                      onChange={formikaction.handleChange}
                      value={formikaction.values.description}
                      className="bg-gray-200 border border-gray-300 text-black text-base rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full px-2 py-5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Description"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-5 bg-blue-600 cursor-pointer hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
                  >
                    send Action
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Property Details Modal */}
      <PropertyDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={selectedProperty}
      />
    </>
  );
}
