import React, { useState, useEffect } from "react";
import propertyEnums from "../../data/propertyEnums.json";

// Convert the enum array to the format needed for the component
const AMENITIES_LIST = propertyEnums.RentalPropertyAmenityEnum?.map(amenity => ({
  id: amenity.toLowerCase().replace(/\s+/g, '_'),
  label: amenity
}));

const RentalDetailsSectionUpdate = ({
  formData,
  setFormData,
  handleChange,
}) => {
  const [activeDurationType, setActiveDurationType] = useState("daily");

  // Handle rent duration type changes
  const handleRentDurationChange = (durationType, field, value) => {
    const numValue = value === "" ? 0 : Number(value);
    
    // Create a deep copy of the current rentDurationType
    const updatedRentDurationType = {
      ...(formData.rentDurationType || {}),
      [durationType]: {
        ...(formData.rentDurationType?.[durationType] || {}),
        [field]: numValue
      }
    };
    
    setFormData(prev => ({
      ...prev,
      rentDurationType: updatedRentDurationType
    }));
  };

  // Handle focus to clear initial "0" value
  const handleFocus = (durationType, field) => {
    if (formData.rentDurationType?.[durationType]?.[field] === 0) {
      const updatedRentDurationType = {
        ...(formData.rentDurationType || {}),
        [durationType]: {
          ...(formData.rentDurationType?.[durationType] || {}),
          [field]: ""
        }
      };
      
      setFormData(prev => ({
        ...prev,
        rentDurationType: updatedRentDurationType
      }));
    }
  };
  
  // Handle blur to restore "0" if empty
  const handleBlur = (durationType, field) => {
    if (formData.rentDurationType?.[durationType]?.[field] === "") {
      const updatedRentDurationType = {
        ...(formData.rentDurationType || {}),
        [durationType]: {
          ...(formData.rentDurationType?.[durationType] || {}),
          [field]: 0
        }
      };
      
      setFormData(prev => ({
        ...prev,
        rentDurationType: updatedRentDurationType
      }));
    }
  };

  // Handle isAvailable checkbox change
  const handleIsAvailableChange = (e) => {
    const isChecked = e.target.checked;
    
    // Set today's date when isAvailable is checked
    if (isChecked) {
      const today = new Date().toISOString().split('T')[0];
      setFormData((prev) => ({
        ...prev,
        isAvailable: isChecked,
        availabilityDate: today
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        isAvailable: isChecked
      }));
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Rental Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Availability
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAvailable"
              name="isAvailable"
              checked={formData.isAvailable || false}
              onChange={handleIsAvailableChange}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="isAvailable" className="ml-2 text-sm text-gray-700">
              Available for rent
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Availability Date
          </label>
          <input
            type="date"
            name="availabilityDate"
            value={
              formData.availabilityDate
                ? formData.availabilityDate.slice(0, 10)
                : ""
            }
            onChange={handleChange}
            disabled={formData.isAvailable}
            className={`w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent ${
              formData.isAvailable ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
        </div>
      </div>

      {/* Rent Duration Types Section */}
      <div className="mt-6">
        <h4 className="text-lg font-medium text-gray-700 mb-3">Rent Duration Options</h4>
        
        {/* Tabs for duration types */}
        <div className="flex border-b mb-4">
          {["daily", "weekly", "monthly"].map((type) => (
            <button
              key={type}
              type="button"
              className={`py-2 px-4 font-medium text-sm ${
                activeDurationType === type
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveDurationType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Fields for the active duration type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.rentDurationType?.[activeDurationType]?.price ?? 0}
                onChange={(e) => handleRentDurationChange(activeDurationType, "price", e.target.value)}
                onFocus={() => handleFocus(activeDurationType, "price")}
                onBlur={() => handleBlur(activeDurationType, "price")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-primary focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">EGP</span>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Security Deposit
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.rentDurationType?.[activeDurationType]?.securityDeposit ?? 0}
                onChange={(e) => handleRentDurationChange(activeDurationType, "securityDeposit", e.target.value)}
                onFocus={() => handleFocus(activeDurationType, "securityDeposit")}
                onBlur={() => handleBlur(activeDurationType, "securityDeposit")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-primary focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">EGP</span>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cleaning Fee
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.rentDurationType?.[activeDurationType]?.cleaningFee ?? 0}
                onChange={(e) => handleRentDurationChange(activeDurationType, "cleaningFee", e.target.value)}
                onFocus={() => handleFocus(activeDurationType, "cleaningFee")}
                onBlur={() => handleBlur(activeDurationType, "cleaningFee")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-primary focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">EGP</span>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Fee
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.rentDurationType?.[activeDurationType]?.serviceFee ?? 0}
                onChange={(e) => handleRentDurationChange(activeDurationType, "serviceFee", e.target.value)}
                onFocus={() => handleFocus(activeDurationType, "serviceFee")}
                onBlur={() => handleBlur(activeDurationType, "serviceFee")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-primary focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">EGP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amenities Section */}
      <div className="mt-6">
        <h4 className="text-lg font-medium text-gray-700 mb-3">Amenities</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {AMENITIES_LIST?.map((amenity) => (
            <div key={amenity.id} className="flex items-center">
              <input
                type="checkbox"
                id={`amenity-${amenity.id}`}
                checked={
                  Array.isArray(formData.amenities)
                    ? formData.amenities.includes(amenity.label)
                    : formData.amenities?.[amenity.id] || false
                }
                onChange={(e) => {
                  if (Array.isArray(formData.amenities)) {
                    // Handle array format
                    const updatedAmenities = e.target.checked
                      ? [...formData.amenities, amenity.label]
                      : formData.amenities.filter(item => item !== amenity.label);
                    
                    setFormData(prev => ({
                      ...prev,
                      amenities: updatedAmenities
                    }));
                  } else {
                    // Handle object format
                    setFormData((prev) => ({
                      ...prev,
                      amenities: {
                        ...prev.amenities,
                        [amenity.id]: e.target.checked,
                      },
                    }));
                  }
                }}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label
                htmlFor={`amenity-${amenity.id}`}
                className="ml-2 text-sm text-gray-700"
              >
                {amenity.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RentalDetailsSectionUpdate;