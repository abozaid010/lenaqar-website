"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const AMENITIES_LIST = [
  "wifi",
  "dryer",
  "air_conditioning",
  "heating",
  "smart_tv",
  "hair_dryer",
  "pool",
  "free_parking",
  "ev_charger",
  "bbq_grill",
  "indoor_fireplace",
  "smoking_allowed",
  "beachfront",
  "smoke_alarm",
  "co_alarm",
];

const RentalDetailsSection = ({ formik }) => {
  const [activeDurationType, setActiveDurationType] = useState("daily");
  const handleRentDurationChange = (durationType, field, value) => {
    const numValue = value === "" ? 0 : Number(value);
    formik.setFieldValue(`rentDurationType.${durationType}.${field}`, numValue);
  };

  // Handle focus to clear initial "0" value
  const handleFocus = (durationType, field) => {
    if (formik.values.rentDurationType?.[durationType]?.[field] === 0) {
      formik.setFieldValue(`rentDurationType.${durationType}.${field}`, "");
    }
  };

  // Handle blur to restore "0" if empty
  const handleBlur = (durationType, field) => {
    if (formik.values.rentDurationType?.[durationType]?.[field] === "") {
      formik.setFieldValue(`rentDurationType.${durationType}.${field}`, 0);
    }
  };

  // Initialize rentDurationType structure if not already set
  useEffect(() => {
    if (
      !formik.values.rentDurationType ||
      typeof formik.values.rentDurationType !== "object"
    ) {
      formik.setFieldValue("rentDurationType", {
        daily: {
          price: 0,
          securityDeposit: 0,
          cleaningFee: 0,
          serviceFee: 0,
          currency: "EGP",
        },
        weekly: {
          price: 0,
          securityDeposit: 0,
          cleaningFee: 0,
          serviceFee: 0,
          currency: "EGP",
        },
        monthly: {
          price: 0,
          securityDeposit: 0,
          cleaningFee: 0,
          serviceFee: 0,
          currency: "EGP",
        },
      });
    }
  }, []);

  const onAmenityChange = (amenity, checked) => {
    const updatedAmenities = [...formik.values.amenities];
    if (checked) {
      if (!updatedAmenities.includes(amenity)) {
        updatedAmenities.push(amenity);
      }
    } else {
      const index = updatedAmenities.indexOf(amenity);
      if (index > -1) {
        updatedAmenities.splice(index, 1);
      }
    }

    console.log("Updated Amenities:", updatedAmenities);

    formik.setFieldValue("amenities", updatedAmenities);
  };

  const handleRemoveAmenity = (amenityId) => {
    const currentAmenities = { ...formik.values.amenities };
    delete currentAmenities[amenityId];
    formik.setFieldValue("amenities", currentAmenities);
  };

  const handleIsAvailableChange = (e) => {
    const isChecked = e.target.checked;
    formik.setFieldValue("isAvailable", isChecked);

    // Set today's date when isAvailable is checked
    if (isChecked) {
      const today = new Date().toISOString().split("T")[0];
      formik.setFieldValue("availabilityDate", today);
    }
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
              onChange={handleIsAvailableChange}
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
            disabled={formik.values.isAvailable}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.availabilityDate && formik.errors.availabilityDate
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent ${formik.values.isAvailable ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
          {formik.touched.availabilityDate &&
            formik.errors.availabilityDate && (
              <p className="mt-1 text-sm text-red-500">
                {formik.errors.availabilityDate}
              </p>
            )}
        </div>
      </div>

      {/* Rent Duration Types Section */}
      <div className="mt-6">
        <h4 className="text-lg font-medium text-gray-700 mb-3">
          Rent Duration Options
        </h4>

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
                value={
                  formik.values.rentDurationType?.[activeDurationType]?.price ||
                  0
                }
                onChange={(e) =>
                  handleRentDurationChange(
                    activeDurationType,
                    "price",
                    e.target.value
                  )
                }
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
                value={
                  formik.values.rentDurationType?.[activeDurationType]
                    ?.securityDeposit || 0
                }
                onChange={(e) =>
                  handleRentDurationChange(
                    activeDurationType,
                    "securityDeposit",
                    e.target.value
                  )
                }
                onFocus={() =>
                  handleFocus(activeDurationType, "securityDeposit")
                }
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
                value={
                  formik.values.rentDurationType?.[activeDurationType]
                    ?.cleaningFee || 0
                }
                onChange={(e) =>
                  handleRentDurationChange(
                    activeDurationType,
                    "cleaningFee",
                    e.target.value
                  )
                }
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
                value={
                  formik.values.rentDurationType?.[activeDurationType]
                    ?.serviceFee || 0
                }
                onChange={(e) =>
                  handleRentDurationChange(
                    activeDurationType,
                    "serviceFee",
                    e.target.value
                  )
                }
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

      {/* Amenities Section with Checkboxes */}
      <div className="mt-6">
        <h4 className="text-lg font-medium text-gray-700 mb-3">Amenities</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {AMENITIES_LIST.map((a) => (
            <div key={a} className="flex items-center">
              <input
                type="checkbox"
                id={`a-${a.id}`}
                checked={formik.values.amenities.includes(a)}
                onChange={(e) => onAmenityChange(a, e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor={`a-${a}`} className="ml-2 text-sm text-gray-700">
                {a}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Display Custom Amenities */}
      {formik.values.amenities.length > 0 && (
        <div className="mt-4">
          <h5 className="text-md font-medium text-gray-700 mb-2">
            Custom Amenities
          </h5>
          <div className="flex flex-wrap gap-2">
            {formik.values.amenities
              .filter(
                ([key]) => !AMENITIES_LIST.some((item) => item.id === key)
              )
              .map(([key, value]) => (
                <div
                  key={key}
                  className={`px-3 py-1 rounded-full text-sm flex items-center ${
                    value
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <span>{key.replace(/_/g, " ")}</span>
                  <span className="ml-1 text-xs">
                    ({value ? "Available" : "Not Available"})
                  </span>
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
