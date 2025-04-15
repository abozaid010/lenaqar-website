import React from "react";

const AMENITIES_LIST = [
  { id: "wifi", label: "WiFi" },
  { id: "air_condition", label: "Air Conditioning" },
  { id: "parking", label: "Parking" },
  { id: "gym", label: "Gym" },
  { id: "pool", label: "Swimming Pool" },
  { id: "security", label: "Security" },
  { id: "elevator", label: "Elevator" },
  { id: "balcony", label: "Balcony" },
  { id: "garden", label: "Garden" },
  { id: "cleaning", label: "Cleaning Service" },
];

const RentalDetailsSection = ({ formData, setFormData, handleChange }) => {
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
          <select
            name="availability"
            value={formData.availability ? "true" : "false"}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                availability: e.target.value === "true",
              }));
            }}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="true">Available</option>
            <option value="false">Not Available</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Starting Date
          </label>
          <input
            type="date"
            name="startingDate"
            value={formData.startingDate}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Rent
          </label>
          <input
            type="number"
            name="monthlyRent"
            value={formData.monthlyRent}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weekly Rent
          </label>
          <input
            type="number"
            name="weeklyRent"
            value={formData.weeklyRent}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Daily Rent
          </label>
          <input
            type="number"
            name="dailyRent"
            value={formData.dailyRent}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Amenities Section */}
      <div className="mt-6">
        <h4 className="text-lg font-medium text-gray-700 mb-3">
          Amenities
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {AMENITIES_LIST.map((amenity) => (
            <div key={amenity.id} className="flex items-center">
              <input
                type="checkbox"
                id={`amenity-${amenity.id}`}
                checked={formData.amenities[amenity.id] || false}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    amenities: {
                      ...prev.amenities,
                      [amenity.id]: e.target.checked,
                    },
                  }));
                }}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
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

export default RentalDetailsSection;