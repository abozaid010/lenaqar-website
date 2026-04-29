"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

const FilterMonth = ({appliedFilters,t}) => {
    const router = useRouter();
    const[filter,setFilter]=useState({
        months: appliedFilters?.months || "1"
    })
    const months = [
        { value: "1" },
        { value: "2" },
        { value: "3" },
        { value: "4" },
        { value: "5" },
        { value: "6" },
        { value: "7" },
        { value: "8" },
        { value: "9" },
        { value: "10" },
        { value: "11" },
        { value: "12" },
    ];
    
    const handleFilterChange = (key, value) => {
        setFilter((prev) => ({ ...prev, [key]: value }));
        
        const newParams = new URLSearchParams(window.location.search);
        newParams.set(key, value);
        router.push(`${window.location.pathname}?${newParams.toString()}`);
    };
    
    return (
        <div className="w-full">
            <div>
                <label className="block text-gray-700 text-xs font-medium mb-1" htmlFor="month-select">
                   {t('selectNumberOfMonths')}
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
                            {month.value === "1" ? t('lastMonth') : t('lastMonths', { count: month.value })}
                        </option>
                    ))}
                </select>
            </div>
            
         
        </div>
    )
}

export default FilterMonth
