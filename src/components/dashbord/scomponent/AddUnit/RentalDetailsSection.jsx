"use client"
import React, { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import propertyEnums from "../../data/propertyEnums.json";

// Use the RentalPropertyAmenityEnum from propertyEnums
const AMENITIES_LIST = propertyEnums.RentalPropertyAmenityEnum.map(amenity => ({
  id: amenity.toLowerCase(), // يحتفظ بالمسافات
  label: amenity
}));


const RentalDetailsSection = ({ formik, handleAmenityChange }) => {
  const [newAmenity, setNewAmenity] = useState("");
  const [amenityAvailability, setAmenityAvailability] = useState(true);
  console.log(formik.values)
  
  // Ensure amenities is initialized as an object for UI handling
  useEffect(() => {
    if (!formik.values.amenities || !Object.keys(formik.values.amenities).length) {
      // Initialize as an empty object for easier UI handling
      formik.setFieldValue("amenities", {});
    } else if (Array.isArray(formik.values.amenities)) {
      // Convert from API format (array) to UI format (object)
      const amenitiesObj = {};
      formik.values.amenities.forEach(item => {
        if (item.amenitiy) { // Note: API has a typo in "amenitiy"
          amenitiesObj[item.amenitiy] = item.availability;
        }
      });
      formik.setFieldValue("amenities", amenitiesObj);
    }
    
    // Remove any reference to _amenitiesArray from formik values
    delete formik.values._amenitiesArray;
  }, []);

  // Use the provided handleAmenityChange or use a local one
  const onAmenityChange = handleAmenityChange || ((amenity, checked) => {
    const updatedAmenities = { ...(formik.values.amenities || {}) };
    updatedAmenities[amenity] = checked;
    formik.setFieldValue("amenities", updatedAmenities);
  });

  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return;
    
    // Make sure we're working with an object for amenities
    const currentAmenities = formik.values.amenities || {};
    // Format the amenity key - lowercase and replace spaces with underscores
    const amenityKey = newAmenity.trim().toLowerCase().replace(/\s+/g, '_');
    
    // Check if this amenity already exists
    if (currentAmenities[amenityKey] !== undefined) {
      // Just update the existing amenity's availability
      currentAmenities[amenityKey] = amenityAvailability;
    } else {
      // Add new amenity
      currentAmenities[amenityKey] = amenityAvailability;
    }
    
    formik.setFieldValue("amenities", {...currentAmenities});
    setNewAmenity("");
    setAmenityAvailability(true);
  };

  const handleRemoveAmenity = (amenityId) => {
    const currentAmenities = { ...formik.values.amenities };
    delete currentAmenities[amenityId];
    formik.setFieldValue("amenities", currentAmenities);
  };

  return (
    <div className="mb-8">
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
              checked={formik.values.isAvailable || false}
              onChange={(e) => {
                formik.setFieldValue("isAvailable", e.target.checked);
              }}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="isAvailable" className="ml-2 text-sm text-gray-700">
              Available for rent
            </label>
          </div>
          {formik.touched.isAvailable && formik.errors.isAvailable && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.isAvailable}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Availability Date
          </label>
          <input
            type="date"
            name="availabilityDate"
            value={formik.values.availabilityDate || ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.availabilityDate && formik.errors.availabilityDate
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent`}
          />
          {formik.touched.availabilityDate && formik.errors.availabilityDate && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.availabilityDate}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rent Duration Type
          </label>
          <select
            name="rentDurationType"
            value={formik.values.rentDurationType || ""}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.rentDurationType && formik.errors.rentDurationType
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent`}
          >
            <option value="" disabled>Select Duration</option>
            {propertyEnums.RentDurationType.map((durationType, index) => (
              <option 
                key={index} 
                value={durationType}
              >
                {durationType.charAt(0).toUpperCase() + durationType.slice(1)}
              </option>
            ))}
          </select>
          {formik.touched.rentDurationType && formik.errors.rentDurationType && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.rentDurationType}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rent Price
          </label>
          <input
            type="number"
            name="rentPrice"
            min="0"
            value={formik.values.rentPrice || ""}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value < 0) e.target.value = 0;
              formik.handleChange(e);
            }}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.rentPrice && formik.errors.rentPrice
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent`}
          />
          {formik.touched.rentPrice && formik.errors.rentPrice && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.rentPrice}
            </p>
          )}
        </div>
      </div>

      {/* Amenities Section with Checkboxes */}
      <div className="mt-6">
        <h4 className="text-lg font-medium text-gray-700 mb-3">Amenities</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {AMENITIES_LIST.map((amenity) => (
            <div key={amenity.id} className="flex items-center">
              <input
                type="checkbox"
                id={`amenity-${amenity.id}`}
                checked={Boolean(formik.values.amenities?.[amenity.id])}
                onChange={(e) => onAmenityChange(amenity.id, e.target.checked)}
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

      {/* Custom Amenity Input */}
      {/* <div className="mt-4 flex items-center">
        <input
          type="text"
          value={newAmenity}
          onChange={(e) => setNewAmenity(e.target.value)}
          placeholder="Add custom amenity"
          className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-primary focus:border-transparent mr-2"
        />
        <div className="flex items-center mr-2">
          <input
            type="checkbox"
            id="amenity-availability"
            checked={amenityAvailability}
            onChange={(e) => setAmenityAvailability(e.target.checked)}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
          />
          <label htmlFor="amenity-availability" className="ml-2 text-sm text-gray-700">
            Available
          </label>
        </div>
        <button
          type="button"
          onClick={handleAddAmenity}
          className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div> */}

      {/* Display Custom Amenities */}
      {formik.values.amenities && Object.entries(formik.values.amenities).filter(
        ([key]) => !AMENITIES_LIST.some(item => item.id === key)
      ).length > 0 && (
        <div className="mt-4">
          <h5 className="text-md font-medium text-gray-700 mb-2">Custom Amenities</h5>
          <div className="flex flex-wrap gap-2">
            {Object.entries(formik.values.amenities)
              .filter(([key]) => !AMENITIES_LIST.some(item => item.id === key))
              .map(([key, value]) => (
                <div 
                  key={key} 
                  className={`px-3 py-1 rounded-full text-sm flex items-center ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  <span>{key.replace(/_/g, ' ')}</span>
                  <span className="ml-1 text-xs">({value ? 'Available' : 'Not Available'})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(key)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalDetailsSection;