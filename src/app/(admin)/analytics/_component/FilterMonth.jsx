"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const FilterMonth = ({appliedFilters}) => {
    const router = useRouter();
    const[filter,setFilter]=useState({
        months: appliedFilters?.months || "12"
    })
    const [message, setMessage] = useState("");
    
    const months = [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
    ];
    
    const handleFilterChange = (key, value) => {
        setFilter((prev) => ({ ...prev, [key]: value }));
        
        // Generate message based on the number of months selected
        const numMonths = parseInt(value);
        const monthLabel = numMonths === 1 ? "month" : "months";
        setMessage(`Now showing statistics for the last ${numMonths} ${monthLabel}`);

        const newParams = new URLSearchParams(window.location.search);
        newParams.set(key, value);
        router.push(`${window.location.pathname}?${newParams.toString()}`);
    };
    
    return (
        <div className="w-full mx-auto">
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="month-select">
                    Select Number of Months
                </label>
                <select
                    id="month-select"
                    value={filter.months}
                    onChange={(e) => handleFilterChange("months", e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                    <option value="12">Last 12 Months</option>
                    {months.map((month) => (
                        <option key={month.value} value={month.value}>
                            {month.value === "1" ? "Last Month" : `Last ${month.value} Months`}
                        </option>
                    ))}
                </select>
            </div>
            
         
        </div>
    )
}

export default FilterMonth
