"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const FormMultiSelect = ({
  label,
  placeholder = "Select options",
  name,
  value = [],
  onChange,
  options = [],
  valueKey = "value",
  labelKey = "label",
  required = false,
  error = false,
  errorMessage = "",
  className = "",
  locale = "en",
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (optionValue) => {
    let newValues;

    if (value.includes(optionValue)) {
      // Remove option if already selected
      newValues = value.filter((val) => val !== optionValue);
    } else {
      // Add option if not selected
      newValues = [...value, optionValue];
    }

    const syntheticEvent = {
      target: {
        name,
        value: newValues,
      },
    };

    onChange(syntheticEvent);
  };

  // Display selected options
  const getDisplayValue = () => {
    if (!value || value.length === 0) return "";

    const selectedOptions = options.filter((opt) =>
      value.includes(opt[valueKey])
    );

    return selectedOptions
      .map((opt) => opt[labelKey] ?? (locale === "ar" ? opt.ar_label : opt.en_label))
      .join(", ");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label
          className={`block text-sm font-medium mb-1 ${error ? "text-red-500" : "text-gray-700"}`}
          htmlFor={name}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          className={`block w-full rounded-md border py-1 px-2 bg-white text-gray-900 focus:outline-none focus:ring-1 appearance-none text-left ${
            error
              ? "border-red-500 ring-red-500 text-red-500"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          } ${className}`}
          onClick={handleToggle}
          {...rest}
        >
          <div className="flex justify-between items-center">
            <span className={!value.length ? "text-gray-400" : ""}>
              {getDisplayValue() || placeholder}
            </span>
            <ChevronDown className="text-gray-400 w-5 h-5" />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <ul className="py-1 max-h-96 overflow-auto">
              {options.map((option) => (
                <li
                  key={option[valueKey]}
                  className={`p-2 cursor-pointer hover:bg-gray-100 ${
                    value.includes(option[valueKey]) ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleOptionClick(option[valueKey])}
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={value.includes(option[valueKey])}
                      onChange={() => {}}
                      className="mr-2 h-4 w-4"
                    />
                    <span className="text-gray-900">
                      {option[labelKey] ?? (locale === "ar" ? option.ar_label : option.en_label)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {error && errorMessage && (
        <div className="text-xs text-red-500 mt-1">{errorMessage}</div>
      )}
    </div>
  );
};

export default FormMultiSelect;
