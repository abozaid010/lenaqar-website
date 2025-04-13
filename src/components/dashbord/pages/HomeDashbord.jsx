"use client";

import React, { useEffect, useState } from "react";

import {
  Search,
  Filter,
  MessageSquare,
  Phone,
  Home,
  Calendar,
  CheckCircle,
  X,
  Eye,
  ChevronDown,
} from "lucide-react";

import formatDateForDisplay from "@/utils/formateDate";
import PropertyDetailsModal from "../scomponent/PropertyDetailsModal";
import { fetchUsersData } from "@/components/services/serviceFetching";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import axiosInstance from "@/utils/axiosInstance";

const RealEstateDashboard = ({ users }) => {
  // Sample data
  const router = useRouter();
  const [usersData, setUsersData] = useState(users?.users);
  const [hasMore, setHasMore] = useState(users?.pagination?.has_more);
  const [nextCursor, setNextCursor] = useState(users?.pagination?.next_cursor);
  const [previousCursor, setPreviousCursor] = useState(null);
  // Sample property details data
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

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
  // const [leads, setLeads] = useState(initialLeads);
  const [activeTab, setActiveTab] = useState("All Chats");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpenn, setIsOpenn] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isOpenmodle, setIsOpenmodle] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [SelectedAction, setSelectedAction] = useState(null);
  // Date filter states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("2025-03-26");
  const [endDate, setEndDate] = useState("2025-04-12");
  const [action, setaction] = useState(null);

  const [activeTab2, setActiveTab2] = useState(null);

  const [displayDateRange, setDisplayDateRange] = useState(
    "26 Mar 25 - 12 Apr 25"
  );

  // Function to open property details modal
  const openPropertyDetails = (requirement, score, newScore) => {
    const property =
      propertyDetails[requirement] || propertyDetails["Apartment"]; // Fallback
    property["purchaseProbability"] = score; // استخدام score
    property["purchaseProbability"] = newScore; // استخدام newScore
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  // Handle date filter changes
  const handleDateFilterChange = () => {
    const formattedStartDate = formatDateForDisplay(startDate);
    const formattedEndDate = formatDateForDisplay(endDate);
    setDisplayDateRange(`${formattedStartDate} - ${formattedEndDate}`);

    // Filter leads based on date range
    const filteredByDate = initialLeads.filter((lead) => {
      const [day, month, year] = lead.date.split("-");
      const leadDate = new Date(`20${year}-${month}-${day}`);
      return leadDate >= new Date(startDate) && leadDate <= new Date(endDate);
    });

    setLeads(filteredByDate);
    setShowDatePicker(false);
  };

  // Reset to all leads
  const resetFilters = () => {
    setLeads(initialLeads);
    setSearchTerm("");
    setCurrentPage(1); // Reset to first page when filters are reset
  };

  const handleNextPage = async () => {
    if (hasMore) {
      setPreviousCursor(nextCursor);
      setCurrentPage(currentPage + 1);
      const nextUsers = await fetchUsersData(nextCursor);
      setUsersData([...nextUsers.data.users]);
      setNextCursor(nextUsers.data.pagination.next_cursor);
      setHasMore(nextUsers.data.pagination.has_more);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Follow up later":
        return {
          bgColor: "bg-gray-100 text-gray-700",
          icon: <MessageSquare size={14} className="mr-1" />,
        };
      case "Not interested":
        return {
          bgColor: "bg-gray-200 text-gray-700",
          icon: <X size={14} className="mr-1" />,
        };
      case "Missing requirement":
        return {
          bgColor: "bg-orange-500 text-white",
          icon: <Filter size={14} className="mr-1" />,
        };
      case "Property view":
        return {
          bgColor: "bg-blue-200 text-blue-700",
          icon: <Eye size={14} className="mr-1" />,
        };
      case "Office visit":
        return {
          bgColor: "bg-green-100 text-green-700",
          icon: <Home size={14} className="mr-1" />,
        };
      case "Qualified lead":
        return {
          bgColor: "bg-teal-500 text-white",
          icon: <CheckCircle size={14} className="mr-1" />,
        };
      case "Book Viewing":
        return {
          bgColor: "bg-red-500 text-white",
          icon: <Calendar size={14} className="mr-1" />,
        };
      case "Schedule Call":
        return {
          bgColor: "bg-blue-400 text-white",
          icon: <Calendar size={14} className="mr-1" />,
        };
      case "Make a call":
        return {
          bgColor: "bg-green-600 text-white",
          icon: <Phone size={14} className="mr-1" />,
        };
      case "Not qualified":
        return {
          bgColor: "bg-gray-500 text-white",
          icon: <X size={14} className="mr-1" />,
        };
      default:
        return { bgColor: "bg-gray-100", icon: null };
    }
  };

  const actionidd = `${selectedId?.phoneNumber}_${selectedId?.client_id}`;

  const formik = useFormik({
    initialValues: {
      spreadsheet_url: "",
      media_url: "",
    },
    onSubmit: async (values) => {
      const payload = {
        client_id: values.client_id,
        user_id: values.user_id,
        created_at: values.created_at,
        preferred_time: values.preferred_time,
        description: values.description,
        action: values.action,
        actions_history: [
          {
            user: "",
            comment: values.comment,
            created_at: new Date().toISOString(),
            action: values.action,
          },
        ],
      };

      try {
        setLoading(true);

        const response = await axiosInstance.put(
          `/action/${actionidd}`,

          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        toast.success(response.data);
        setLoading(false);
      } catch (error) {
        toast.error(error?.message);
      } finally {
        formikinput.resetForm();
      }
    },
  });

  const formikinput = useFormik({
    enableReinitialize: true, // This allows the form to update when initialValues change
    initialValues: {
      client_id: action?.client_id || "",
      user_id: action?.user_id || "",
      created_at: action?.created_at || "",
      preferred_time: action?.preferred_time,
      description: action?.description || "",
      action: action?.action || "",
    },

    onSubmit: async (values) => {
      const payload = {
        client_id: values.client_id,
        user_id: values.user_id,
        created_at: values.created_at,
        preferred_time: values.preferred_time,
        description: values.description,
        action: values.action,
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
          `/action/${actionidd}`,

          payload,
          {}
        );

        setIsOpenmodle(false);

        toast.success("Action updated successfully!");
        setIsOpenn(false);
      } catch (error) {
        toast.error(error?.message || "Something went wrong");
        // console.error(error);
      } finally {
        setLoading(false);

        formikinput.resetForm();
      }
    },
  });

  const formikaction = useFormik({
    enableReinitialize: true, // This allows the form to update when initialValues change
    initialValues: {
      client_id: SelectedAction?.user?.client_id || "",
      user_id: SelectedAction?.user?.phoneNumber || "",
      created_at: action?.created_at || new Date().toISOString(),
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
        const response = await axiosInstance.post(`/action/`, payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        // console.log(response)
        toast.success("Action updated successfully!");
        setIsOpenn(false);
      } catch (error) {
        toast.error(error?.message || "Something went wrong");
        // console.error(error);
      } finally {
        setLoading(false);
        formikaction.resetForm();
      }
    },
  });

  useEffect(() => {
    if (!selectedId) return;
    const fetchData = async () => {
      const actionidd = `${selectedId?.phoneNumber}_${selectedId?.client_id}`;

      try {
        const response = await axiosInstance.get(`/action/${actionidd}`);

        setaction(response?.data);
      } catch (error) {
        toast.error(error?.message);
        // console.error(error);
      }
    };

    fetchData();
    setActiveTab2(selectedId?.user?.actions?.actions_history);
  }, [selectedId]);
  // console.log(activeTab2);

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm">
        <div className="p-3 sm:p-4 md:p-6">
          {/* Header with tabs and WhatsApp button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
            <div className="flex flex-wrap w-full sm:w-auto overflow-x-auto bg-gray-100 p-1 rounded-lg">
              {["All Chats", "Recent Chats", "Needs Action", "NO Action"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                      activeTab === tab
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </div>

            <button
              onClick={handleOpenModal}
              className="w-full sm:w-auto bg-[#1e3a8a] hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare size={16} />
              WhatsApp Leads
            </button>

            {isOpen && (
              <div className="fixed inset-0 bg-[#00000042] bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-md p-6 relative">
                  {/* إغلاق */}
                  <button
                    onClick={handleCloseModal}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 mt-4"
                  >
                    <X size={20} />
                  </button>

                  <h2 className="text-lg font-semibold mb-2">
                    {" "}
                    Send Cold Whats Messages Patch
                  </h2>
                  <div>
                    <form onSubmit={formik.handleSubmit}>
                      <div className="grid gap-12 mt-5 mb-5">
                        <div>
                          <label
                            htmlFor="spreadsheet_url"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            Link or File
                          </label>
                          <input
                            type="text"
                            id="spreadsheet_url"
                            name="spreadsheet_url"
                            onChange={formik.handleChange}
                            value={formik.values.spreadsheet_url}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
            focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5
            dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
            dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Spreadsheet Link"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="media_url"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            Video Link
                          </label>
                          <input
                            type="text"
                            id="media_url"
                            name="media_url"
                            onChange={formik.handleChange}
                            value={formik.values.media_url}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
            focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5
            dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
            dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="Video Link"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-[#1e3a8a] text-white px-4 py-2 rounded"
                        >
                          {loading ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="flex justify-end gap-2">
                    {/* <button
                        onClick={handleCloseModal}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => {
                          // من هنا ترسل رسائل واتساب
                          console.log("تم الإرسال...");
                          setIsOpen(false);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                      >
                        إرسال
                      </button> */}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search and filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, number, or requirements"
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
              >
                <Filter size={16} />
                <span className="hidden xs:inline">Filter</span>
              </button>

              {/* Date filter with dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                >
                  <span className="hidden sm:inline">{displayDateRange}</span>
                  <span className="sm:hidden">Date</span>
                  <ChevronDown size={14} />
                </button>

                {showDatePicker && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg p-4 z-10">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-md p-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-md p-2 text-sm"
                        />
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleDateFilterChange}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Table with responsive design */}
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr className="text-left text-xs sm:text-sm font-medium text-gray-600">
                      <th className="px-2 sm:px-4 py-2 sm:py-3">Name</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                        User Number
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3">Date</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                        Requirements
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        <MessageSquare size={16} />
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersData?.map((user, x) => {
                      // console.log("Ahmed0000000000000000000", user?.actions, x);

                      const lastMessage =
                        user.conversation?.[0]?.user_message || "";
                      const lastActivity = new Date(
                        user.lastActivity
                      ).toLocaleDateString();
                      const requirements =
                        user.requirements?.userBuildingType?.[0] ||
                        "Not specified";
                      const messageCount = user.conversation?.length || 0;

                      const status = user.actions?.action || "No Action";

                      const statusStyle = getStatusStyle(status);
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
                          className="hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                        >
                          <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-gray-900">
                            <div className="flex flex-col sm:hidden">
                              <span className="text-xs text-gray-500">
                                {user.phoneNumber}
                              </span>
                              <span
                                className="text-xs text-blue-600 cursor-pointer hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPropertyDetails(requirements);
                                }}
                              >
                                {requirements}
                              </span>
                            </div>
                            <span className="hidden sm:inline">
                              {user.phoneNumber}
                            </span>
                          </td>

                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 hidden sm:table-cell">
                            {user.phoneNumber}
                          </td>

                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600">
                            {lastActivity}
                          </td>

                          <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                            <span
                              className="text-blue-600 cursor-pointer hover:underline"
                              onClick={(e) => {
                                e.stopPropagation(); // لمنع تفعيل onClick للـ tr
                                openPropertyDetails(actions, score);
                              }}
                            >
                              {/* {requirements}
                               */}
                              {requirements}
                              {/* {actions}  */}
                            </span>
                          </td>

                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium">
                            {messageCount}
                          </td>

                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex justify-center">
                              <span
                                className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                                  status === "Hot"
                                    ? "bg-green-100 text-green-700"
                                    : status === "Warm"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : " text-gray-700"
                                }`}
                              >
                                {/* <button className="btn text-white bg-[gray]  hover:bg-gray-600 focus:ring-4  font-medium rounded-lg text-sm px-2 cursor-pointer py-1.5 me-2 mb-2 dark:bg-blue-900 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpenn(true);
                                    setSelectedAction({
                                      user: user
                                    });
                                  }}
                                  aria-haspopup="dialog"
                                  aria-expanded={isOpen}
                                  aria-controls="hs-basic-modal"
                                >Create Action
                                </button> */}

                                {/* {console.log(user?.actions.action)  } */}

                                {user?.actions &&
                                Object.keys(user.actions).length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsOpenmodle(true);
                                      setSelectedId({
                                        phoneNumber: user?.phoneNumber,
                                        client_id: user?.client_id,
                                        user: user,
                                      });
                                    }}
                                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-2 cursor-pointer py-1.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                  >
                                    {user?.actions.action}
                                  </button>
                                ) : (
                                  <button
                                    className="btn text-white bg-[gray] hover:bg-gray-600 focus:ring-4 font-medium rounded-lg text-sm px-2 cursor-pointer py-1.5 me-2 mb-2 dark:bg-blue-900 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsOpenn(true);
                                      setSelectedAction({
                                        user: user,
                                      });
                                    }}
                                    aria-haspopup="dialog"
                                    aria-expanded={isOpen}
                                    aria-controls="hs-basic-modal"
                                  >
                                    Create Action
                                  </button>
                                )}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Modle in Action  */}
          {isOpenmodle && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000042] bg-opacity-50">
              <div className="relative p-4 w-full max-w-2xl max-h-full">
                <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
                  <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                    <h3 className="text-xl font-semibold  dark:text-blue-500">
                      AI Action
                    </h3>
                    <button
                      onClick={() => setIsOpenmodle(false)}
                      type="button"
                      className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      <svg
                        className="w-3 h-3"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 14 14"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M1 1l6 6m0 0l6 6M7 7l6-6M7 7L1 13"
                        />
                      </svg>
                      <span className="sr-only">Close modal</span>
                    </button>
                  </div>

                  <div className="p-4 md:p-5 space-y-4">
                    <div className="max-w-2xl mx-auto p-4">
                      {/* Tabs Header */}
                      {/* <div className="flex  mb-4 border-b border-blue-500">
                        <button
                          onClick={() => setActiveTab2("form1")}
                          className={`py-2 px-4 text-sm font-medium ${activeTab2 === "form1"
                            ? "border-b-2 border-blue-500 text-[#1e3a8a]"
                            : "text-gray-500"
                            }`}
                        >
                        
                        </button>
              
                      </div> */}

                      {/* Tab Content */}
                      <form
                        className="space-y-6 "
                        onSubmit={formikinput.handleSubmit}
                      >
                        <div>
                          <div className="mt-10 mb-10 space-y-4">
                            {activeTab2?.map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-start border-b pb-2"
                              >
                                <h5 className="font-bold">
                                  {item?.user || "غير متاح"}
                                </h5>
                                <p>{item?.comment || "لا توجد تعليقات"}</p>
                                <p>{item?.action || "لم يتم تحديد الإجراء"}</p>
                              </div>
                            ))}
                          </div>

                          <label
                            htmlFor="action"
                            className="block mb-1 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            Action
                          </label>
                          <select
                            id="action"
                            name="action"
                            onChange={formikinput.handleChange}
                            value={formikinput.values.action}
                            className="bg-gray-100 border-gray-300 text-sm rounded-lg block w-full p-3"
                            required
                          >
                            <option value="">Select an option</option>
                            <option value="Make a call">Make a call</option>
                            <option value="Office visit">Office visit</option>
                            <option value="Property view">Property view</option>
                            <option value="Not interested">
                              Not interested
                            </option>
                            <option value="Not qualified">Not qualified</option>
                            <option value="Follow up later">
                              Follow up later
                            </option>
                            <option value="Missing Requirement">
                              Missing Requirement
                            </option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="comment"
                            className="block mb-1 font-medium text-sm text-gray-900 dark:text-white"
                          >
                            Comment
                          </label>
                          <input
                            type="text"
                            id="comment"
                            name="comment"
                            onChange={formikinput.handleChange}
                            value={formikinput.values.comment}
                            className="bg-gray-200 border border-gray-300 text-black rounded-lg w-full p-3"
                            placeholder="comment"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
                        >
                          Submit
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pagination controls */}
          {usersData?.length > 0 && (
            <div className="flex justify-end items-center mt-4">
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!hasMore}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    hasMore
                      ? "bg-[#1e3a8a] text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

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
        </div>
      </div>
      {/* Property Details Modal */}
      <PropertyDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={selectedProperty}
      />
    </div>
  );
};
export default RealEstateDashboard;
