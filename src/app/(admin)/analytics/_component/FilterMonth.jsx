"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const FilterMonth = ({appliedFilters,t}) => {
    const router = useRouter();
    const[filter,setFilter]=useState({
        months: appliedFilters?.months || "1"
    })
    const [message, setMessage] = useState("");
    
    const months = [
        { value: "1", label: t?.January },
        { value: "2", label: t?.February },
        { value: "3", label: t?.March },
        { value: "4", label: t?.April },
        { value: "5", label: t?.May },
        { value: "6", label: t?.June },
        { value: "7", label: t?.July },
        { value: "8", label: t?.August },
        { value: "9", label: t?.September },
        { value: "10", label: t?.October },
        { value: "11", label: t?.November },
        { value: "12", label: t?.December },
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
        <div className="w-full">
            <div>
                <label className="block text-gray-700 text-xs font-medium mb-1" htmlFor="month-select">
                   {t?.selectNumberOfMonths}
                </label>
                <select
                    id="month-select"
                    value={filter.months}
                    onChange={(e) => handleFilterChange("months", e.target.value)}
                    className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:shadow-outline"
                >
                    {/* <option value="12">Last 12 Months</option> */}
                    {months.map((month) => (
                        <option key={month.value} value={month.value}>
                            {month.value === "1" ? `${t?.lastMonth}` : t?.lastMonths?.replace("{count}", month.value) || `Last ${month.value} Months`}
                        </option>
                    ))}
                </select>
            </div>
            
         
        </div>
    )
}

export default FilterMonth
