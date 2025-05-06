"use client";

import { useState } from "react";
import { useI18n } from "@/context/translate-api";

const availableAmenities = [
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

export default function RentalDetailsStep({ formData, updateFormData }) {
  const [activeDuration, setActiveDuration] = useState("monthly");
  const { t } = useI18n();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      if (name.startsWith("amenity-")) {
        const amenityName = name.replace("amenity-", "");
        const updatedAmenities = [...formData.amenities];

        if (checked) {
          if (!updatedAmenities.includes(amenityName)) {
            updatedAmenities.push(amenityName);
          }
        } else {
          const index = updatedAmenities.indexOf(amenityName);
          if (index !== -1) {
            updatedAmenities.splice(index, 1);
          }
        }

        updateFormData({ amenities: updatedAmenities });
      } else {
        updateFormData({ [name]: checked });
      }
    } else {
      updateFormData({ [name]: value });
    }
  };

  const handlePriceChange = (durationType, field, value) => {
    updateFormData({
      rentDurationType: {
        ...formData.rentDurationType,
        [durationType]: {
          ...formData.rentDurationType[durationType],
          [field]: value,
        },
      },
    });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3 text-slate-800">
        {t.rentalDetails.availability}{" "}
        {!formData.isAvailable ? (
          <span className="text-sm text-gray-400 font-normal">
            {t.rentalDetails.chooseAvailabilityDate} <span className="text-red-500">*</span>
          </span>
        ) : null}
      </h3>

      {/* Availability */}
      <div className="flex items-center gap-8">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAvailable"
            name="isAvailable"
            checked={formData.isAvailable}
            onChange={handleChange}
            className="h-4 w-4"
          />
          <label
            htmlFor="isAvailable"
            className="ml-2 block text-sm text-gray-700"
          >
            {t.rentalDetails.availableForRent}
          </label>
        </div>

        {/* Availability Date */}
        <div className="flex-1 max-w-60">
          <input
            type="date"
            name="availabilityDate"
            value={formData.availabilityDate}
            disabled={formData.isAvailable}
            onChange={handleChange}
            className={`block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              formData.isAvailable ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-3 mt-6 text-slate-800">
        {t.rentalDetails.rentDurationOptions}
      </h3>

      {/* Rent Duration Options */}
      <div className="mb-3">
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveDuration("daily")}
            className={`py-1 px-4 font-medium text-sm ${
              activeDuration === "daily"
                ? "text-blue-950 border-b-2 border-blue-950"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.rentalDetails.daily}
          </button>
          <button
            type="button"
            onClick={() => setActiveDuration("weekly")}
            className={`py-1 px-4 font-medium text-sm ${
              activeDuration === "weekly"
                ? "text-blue-950 border-b-2 border-blue-950"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.rentalDetails.weekly}
          </button>
          <button
            type="button"
            onClick={() => setActiveDuration("monthly")}
            className={`py-1 px-4 font-medium text-sm ${
              activeDuration === "monthly"
                ? "text-blue-950 border-b-2 border-blue-950"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.rentalDetails.monthly}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4">
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.rentalDetails.price} <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <input
              type="number"
              value={formData.rentDurationType[activeDuration].price}
              onChange={(e) =>
                handlePriceChange(activeDuration, "price", e.target.value)
              }
              min="0"
              placeholder="200"
              required
              className="block w-full rounded-l-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
              EGP
            </span>
          </div>
        </div>

        {/* Security Deposit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.rentalDetails.securityDeposit}
          </label>
          <div className="flex">
            <input
              type="number"
              value={formData.rentDurationType[activeDuration].securityDeposit}
              onChange={(e) =>
                handlePriceChange(
                  activeDuration,
                  "securityDeposit",
                  e.target.value
                )
              }
              min="0"
              placeholder="0"
              className="block w-full rounded-l-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
              EGP
            </span>
          </div>
        </div>

        {/* Cleaning Fee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.rentalDetails.cleaningFee}
          </label>
          <div className="flex">
            <input
              type="number"
              value={formData.rentDurationType[activeDuration].cleaningFee}
              onChange={(e) =>
                handlePriceChange(activeDuration, "cleaningFee", e.target.value)
              }
              min="0"
              placeholder="0"
              className="block w-full rounded-l-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
              EGP
            </span>
          </div>
        </div>

        {/* Service Fee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.rentalDetails.serviceFee}
          </label>
          <div className="flex">
            <input
              type="number"
              value={formData.rentDurationType[activeDuration].serviceFee}
              onChange={(e) =>
                handlePriceChange(activeDuration, "serviceFee", e.target.value)
              }
              min="0"
              placeholder="0"
              className="block w-full rounded-l-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
              EGP
            </span>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="mt-6">
        <h4 className="text-lg font-medium mb-3">{t.rentalDetails.amenitiesTitle || "Amenities"}</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-y-2">
          {availableAmenities.map((amenity) => (
            <div key={amenity} className="flex items-center">
              <input
                type="checkbox"
                id={`amenity-${amenity}`}
                name={`amenity-${amenity}`}
                checked={formData.amenities.includes(amenity)}
                onChange={handleChange}
                className="h-3 w-3 cursor-pointer"
              />
              <label
                htmlFor={`amenity-${amenity}`}
                className="ml-2 block text-sm text-gray-700 cursor-pointer"
              >
                {typeof t.rentalDetails.amenities === 'object' && t.rentalDetails.amenities[amenity] 
                  ? t.rentalDetails.amenities[amenity] 
                  : amenity}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}