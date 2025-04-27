"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ChevronDown } from "lucide-react";

const ACTIONS = [
  { label: "All actions", value: "" },
  { label: "Make a call", value: "Make a call" },
  { label: "Office visit", value: "Office visit" },
  { label: "Property view", value: "Property view" },
  { label: "Not interested", value: "Not interested" },
  { label: "Not qualified", value: "Not qualified" },
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
  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date;
  }, []);
  const tenDaysAgo = useMemo(() => {
    const date = new Date(tomorrow);
    date.setDate(tomorrow.getDate() - 11);
    return date;
  }, [tomorrow]);

  const [filters, setFilters] = useState(() => {
    return {
      actions: appliedFilters.actions || "",
      start_date:
        appliedFilters.start_date || tenDaysAgo.toISOString(),
      end_date: appliedFilters.end_date || tomorrow.toISOString(),
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
    // If the key is start_date or end_date, convert it to ISO format
    let selectdDate = value;
    if ((key === 'start_date' || key === 'end_date') && !value.includes('T')) {
      // If the date is in YYYY-MM-DD format, convert it to ISO format
      const dateObj = new Date(value);
      // Add time to the date (00:00:00 for start date)
      if (key === 'start_date') {
        dateObj.setHours(0, 0, 0, 0);
      }
      // Add time to the date (23:59:59 for end date)
      if (key === 'end_date') {
        dateObj.setHours(23, 59, 59, 999);
      }
      selectdDate = dateObj.toISOString();
    }
    
    setFilters((prev) => ({
      ...prev,
      [key]: selectdDate,
    }));

    const params = new URLSearchParams();
    const updatedFilters = { ...filters, [key]: selectdDate };
    
    // Add parameters only if they are not empty
    Object.entries(updatedFilters).forEach(([k, v]) => {
      if (v) {
        params.append(k, v);
      }
    });

    router.push(`${window.location.pathname}?${params.toString()}`, { replace: true });
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
                      value={filters.start_date.split('T')[0]}
                      onChange={(filter) => {
                        // Create date object with the selected date
                        // Use UTC to avoid timezone issues
                        const selectedDate = filter.target.value;
                        const dateObj = new Date(selectedDate + 'T00:00:00.000Z');
                        
                        // Ensure we're setting to midnight in the correct timezone
                        const isoDate = dateObj.toISOString();
                        
                        setFilters((prev) => ({
                          ...prev,
                          start_date: isoDate,
                        }));
                      }}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.end_date.split('T')[0]}
                      onChange={(filter) => {
                        // Create date object with the selected date
                        // Use UTC to avoid timezone issues
                        const selectedDate = filter.target.value;
                        const dateObj = new Date(selectedDate + 'T23:59:59.999Z');
                        
                        // Ensure we're setting to end of day in the correct timezone
                        const isoDate = dateObj.toISOString();
                        
                        setFilters((prev) => ({
                          ...prev,
                          end_date: isoDate,
                        }));
                      }}
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
          className="w-full sm:w-auto bg-primary hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare size={16} />
          WhatsApp Leads
        </button>
      </div>
    </>
  );
}
