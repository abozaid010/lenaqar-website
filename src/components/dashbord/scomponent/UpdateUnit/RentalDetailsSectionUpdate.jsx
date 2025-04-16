import React from "react";
import  propertyEnums  from "../../data/propertyEnums.json";

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
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  isAvailable: e.target.checked,
                }));
              }}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="isAvailable" className="ml-2 text-sm text-gray-700">
              Available for rent
            </label>
          </div>
        </div>

        <div>
          {console.log(formData.availabilityDate)}
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
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rent Duration Type
          </label>
          <select
            name="rentDurationType"
            value={formData.rentDurationType || ""}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="" disabled>
              Select Duration
            </option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rent Price
          </label>
          <input
            type="number"
            name="rentPrice"
            min="0"
            value={formData.rentPrice || ""}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value < 0) e.target.value = 0;
              handleChange(e);
            }}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
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
