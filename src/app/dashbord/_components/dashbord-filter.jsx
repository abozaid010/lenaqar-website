"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Filter, MessageSquare, ChevronDown } from "lucide-react";

const ACTIONS = [
  { label: "All actions", value: "" },
  { label: "Make a call", value: "Make a call" },
  { label: "Office visit", value: "Office visit" },
  { label: "Property view", value: "Property view" },
  { label: "Not interested", value: "Not interested" },
  { label: "Not qualified", value: "Qualified lead" },
  { label: "Follow up later", value: "Follow up later" },
  { label: "Missing Requirement", value: "Missing requirement" },
];

export default function DashbordFilter({ appliedFilters }) {
  const router = useRouter();

  /**
   * Calculate today's date and 7 days ago dynamically
   * Why useMemo?
   * - To avoid unnecessary calculations on every render => improve performance
   * - The `start_date` and `end_date` are initialized with dynamic default values.
       These values will automatically adjust when the component is MOUNTED.
   */
  const today = useMemo(() => new Date(), []);
  const sevenDaysAgo = useMemo(() => {
    const date = new Date(today);
    date.setDate(today.getDate() - 7);
    return date;
  }, [today]);

  /**
   * Why use a function to initialize state, what is the issue with Direct Initialization?
   *    - To avoid unnecessary calculations on every render => improve performance
   *    - The function passed to useState is only executed once, during the initial render.
   */
  const [filters, setFilters] = useState(() => {
    return {
      cursor: appliedFilters.cursor || null,
      actions: appliedFilters.actions || "all",
      start_date:
        appliedFilters.start_date || sevenDaysAgo.toISOString().split("T")[0],
      end_date: appliedFilters.end_date || today.toISOString().split("T")[0],
    };
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const formatDateForDisplay = (date) => {
    const options = { day: "2-digit", month: "short", year: "2-digit" };
    return new Date(date).toLocaleDateString("en-GB", options).replace(",", "");
  };

  const onApplyDateFilter = () => {
    // close the date picker
    setIsDatePickerOpen(false);

    // update the filters state with the selected start and end dates
    setFilters((prev) => ({
      ...prev,
      start_date: filters.start_date,
      end_date: filters.end_date,
    }));

    // update the URL with the new filters
    onFilterChange("start_date", filters.start_date);
    onFilterChange("end_date", filters.end_date);
  };

  const onFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      cursor: appliedFilters.cursor,
    }));

    router.push(
      `${window.location.pathname}?${new URLSearchParams({
        ...filters,
        [key]: value,
      })}`
    );
  };

  return (
    <>
      {/* Filters and WhatsApp button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-3">
        <div className="flex items-center gap-2">
          {/* Filter by action_type */}
          <select
            name="action_type"
            onChange={(e) => onFilterChange("actions", e.target.value)}
            value={filters.actions || "all"}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56 text-gray-700 hover:bg-gray-100 text-sm"
          >
            {ACTIONS.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>

          {/* Filter by start/end dates */}
          <div className="relative inline-block">
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm"
            >
              {`${formatDateForDisplay(filters.start_date)} - ${formatDateForDisplay(
                filters.end_date
              )}`}
              <ChevronDown size={16} />
            </button>

            {isDatePickerOpen && (
              <div className="absolute mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg p-4 z-10">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.start_date}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          start_date: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.end_date}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          end_date: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsDatePickerOpen(false)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onApplyDateFilter}
                      className="bg-blue-600 hover:opacity-95 text-white px-3 py-1 rounded-md text-sm"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TODO: Whatsapp Modal should not rendered here - get modal code from `HomeDashbord` comp and render it in the tright place */}
        <button
          //  onClick={handleOpenModal}
          className="w-full sm:w-auto bg-[#1e3a8a] hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare size={16} />
          WhatsApp Leads
        </button>
      </div>
    </>
  );
}
