import React from "react";
import propertyEnums from "../../data/propertyEnums.json";

const AdditionalDetailsSection = ({ formData, handleChange }) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Additional Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Finishing Type
          </label>
          <select
            name="finishing"
            value={formData.finishing}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select Finishing Type</option>
            {propertyEnums.EnumFinishingType.map((type, index) => (
              <option
                key={index}
                value={type.charAt(0).toUpperCase() + type.slice(1)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default AdditionalDetailsSection;