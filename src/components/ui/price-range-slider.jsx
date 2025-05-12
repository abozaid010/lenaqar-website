"use client";

import { useState, useEffect } from "react";

export default function PriceRangeSlider({ min, max, value, onChange }) {
  const [localValue, setLocalValue] = useState(value);
  const [inputValues, setInputValues] = useState({
    min: value[0],
    max: value[1],
  });

  useEffect(() => {
    setLocalValue(value);
    setInputValues({
      min: value[0],
      max: value[1],
    });
  }, [value]);

  const handleInputChange = (type, e) => {
    // Remove commas and convert to number
    const rawValue = e.target.value.replace(/,/g, "");
    const newValue = rawValue === "" ? "" : Number.parseInt(rawValue, 10) || 0;

    // Update the input field immediately for better UX
    setInputValues({
      ...inputValues,
      [type]: newValue,
    });
  };

  const handleInputBlur = (type) => {
    let minVal = type === "min" ? inputValues.min : localValue[0];
    let maxVal = type === "max" ? inputValues.max : localValue[1];

    // Handle empty inputs
    if (minVal === "") minVal = min;
    if (maxVal === "") maxVal = max;

    // Ensure min <= max
    if (minVal > maxVal) {
      if (type === "min") {
        minVal = maxVal;
      } else {
        maxVal = minVal;
      }
    }

    // Ensure values are within bounds
    minVal = Math.max(min, Math.min(max, minVal));
    maxVal = Math.max(min, Math.min(max, maxVal));

    // Update both local state and parent
    const newValues = [minVal, maxVal];
    setLocalValue(newValues);
    setInputValues({
      min: minVal,
      max: maxVal,
    });
    onChange(minVal, maxVal);
  };

  const formatPrice = (price) => {
    if (price === "") return "";
    return new Intl.NumberFormat("en-US").format(price);
  };

  return (
    <div className="space-y-4">
      {/* Input fields */}
      <div className="flex items-center justify-between">
        <div className="w-24">
          <label className="block text-xs text-gray-500 mb-1">Min Price</label>
          <input
            type="text"
            value={formatPrice(inputValues.min)}
            onChange={(e) => handleInputChange("min", e)}
            onBlur={() => handleInputBlur("min")}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="text-gray-400 mt-4">to</div>

        <div className="w-24">
          <label className="block text-xs text-gray-500 mb-1">Max Price</label>
          <input
            type="text"
            value={formatPrice(inputValues.max)}
            onChange={(e) => handleInputChange("max", e)}
            onBlur={() => handleInputBlur("max")}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <style jsx>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: var(--thumb-size);
          width: var(--thumb-size);
          background-color: var(--thumb-color);
          border-radius: 50%;
          border: none;
          pointer-events: auto;
        }

        input[type="range"]::-moz-range-thumb {
          height: var(--thumb-size);
          width: var(--thumb-size);
          background-color: var(--thumb-color);
          border-radius: 50%;
          border: none;
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
}
