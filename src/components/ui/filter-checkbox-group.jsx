"use client";

import { useState } from "react";

export default function FilterCheckboxGroup({
  title,
  options,
  selectedValue,
  onChange,
  searchable = false,
  maxVisible = 5,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions =
    searchable && searchQuery
      ? options.filter((option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

  const visibleOptions = isExpanded
    ? filteredOptions
    : filteredOptions.slice(0, maxVisible);

  const hasMoreOptions = filteredOptions.length > maxVisible;

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-gray-900">{title}</h3>

      {searchable && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="space-y-1 pr-1">
        {visibleOptions.length > 0 ? (
          visibleOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center space-x-2 text-sm w-fit cursor-pointer"
            >
              <input
                type="checkbox"
                value={option.value}
                checked={option.value === selectedValue}
                onChange={() =>
                  onChange(option.value === selectedValue ? "" : option.value)
                }
                className="rounded text-blue-950 focus:ring-blue-500"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">No options found</p>
        )}
      </div>

      {hasMoreOptions && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-sm text-blue-950 hover:text-blue-800"
        >
          Show all {filteredOptions.length} options
        </button>
      )}

      {isExpanded && hasMoreOptions && (
        <button
          onClick={() => setIsExpanded(false)}
          className="text-sm text-blue-950 hover:text-blue-800"
        >
          Show less
        </button>
      )}
    </div>
  );
}
