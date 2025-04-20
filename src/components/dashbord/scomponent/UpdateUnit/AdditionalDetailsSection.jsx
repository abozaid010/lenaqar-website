import React from "react";
import propertyEnums from "../../data/propertyEnums.json";

const AdditionalDetailsSection = ({ formData, handleChange }) => {
  // Filter finishing types based on purpose
  const finishingTypes = formData.purpose === "Rent" 
    ? propertyEnums.EnumFinishingType.slice(3) 
    : propertyEnums.EnumFinishingType;
  
  // Set default value for finishing if purpose is Rent and no finishing is selected
  React.useEffect(() => {
    if (formData.purpose === "Rent" && (!formData.finishing || formData.finishing === "")) {
      // Set the first value from the filtered list as default
      if (finishingTypes.length > 0) {
        handleChange({
          target: {
            name: "finishing",
            value: finishingTypes[0]
          }
        });
      }
    }
  }, [formData.purpose, formData.finishing]);

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
            value={formData.finishing || ""}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select Finishing Type</option>
            {finishingTypes.map((type, index) => (
              <option
                key={index}
                value={type}
              >
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default AdditionalDetailsSection;