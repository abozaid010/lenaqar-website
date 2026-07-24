"use client";

import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { PhoneField } from "@/components/phone/PhoneField";
import { useI18n } from "@/hooks/useI18n";
import { convertArabicToEnglishNumbers } from "@/utils/formatters";
import {
  isRentVisibilityAvailable,
  resolveRentVisibilityForCheckbox,
} from "@/constants/property-visibility";

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

export default function RentalDetailsStep({
  formData,
  commonFormData,
  clientType,
  showOwnerFields = true,
  ownerMobileRequired = true,
  updateFormData,
  updateCommonFormData,
  invalidFields = [],
  setInvalidFields = () => {},
}) {
  const { t, translate, translateStrict } = useI18n();

  const unitVisibility = commonFormData?.visibility ?? commonFormData?.status;
  const isRentAvailable = isRentVisibilityAvailable(unitVisibility);

  const handleRentAvailabilityChange = (e) => {
    const checked = e.target.checked;
    updateCommonFormData({
      visibility: resolveRentVisibilityForCheckbox(checked, unitVisibility),
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked, dataset } = e.target;

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
    } else if (dataset.formatPrice === "true") {
      const englishValue = convertArabicToEnglishNumbers(value);
      const rawValue = englishValue.replace(/\D/g, "");
      updateFormData({ [name]: rawValue === "" ? "" : Number(rawValue) });
    } else {
      updateFormData({ [name]: convertArabicToEnglishNumbers(value) });
    }
  };

  const handleOwnerChange = (e) => {
    const { name, value } = e.target;

    if (invalidFields.includes(name)) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
    }

    updateCommonFormData({ [name]: value });
  };

  const handleMonthlyRentChange = (value) => {
    const englishValue = convertArabicToEnglishNumbers(value);
    const rawValue = englishValue.replace(/\D/g, "");
    updateFormData({
      monthlyRentPrice: rawValue === "" ? "" : Number(rawValue),
    });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3 text-slate-800">
        {t.rentalDetails.availability}{" "}
        {!isRentAvailable ? (
          <span className="text-sm text-gray-400 font-normal">
            {t.rentalDetails.chooseAvailabilityDate}{" "}
            <span className="text-red-500">*</span>
          </span>
        ) : null}
      </h3>

      {/* Availability */}
      <div className="flex items-center gap-8">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rentAvailable"
            checked={isRentAvailable}
            onChange={handleRentAvailabilityChange}
            className="h-4 w-4"
          />
          <label
            htmlFor="rentAvailable"
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
            disabled={isRentAvailable}
            onChange={handleChange}
            className={`block w-full min-h-[40px] rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              isRentAvailable ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-3 mt-6 text-slate-800">
        {translate("rentalDetails.monthly", t.rentalDetails?.monthly || "Monthly")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4">
        <LenaTextField
          label={translate(
            "rentalDetails.monthlyRentPrice",
            t.rentalDetails?.monthlyRentPrice || "Monthly rent"
          )}
          required
          value={formData.monthlyRentPrice}
          onChange={(e) => handleMonthlyRentChange(e.target.value)}
          placeholder="16000"
          type="money"
          adornment="EGP"
          error={invalidFields.includes("monthlyRentPrice")}
        />
      </div>

      {/* Amenities */}
      <div className="mt-6">
        <h4 className="text-lg font-medium mb-3">
          {t.rentalDetails.amenitiesTitle || "Amenities"}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-2">
          {availableAmenities.map((amenity) => (
            <div key={amenity} className="flex items-center gap-2">
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
                className="block text-sm text-gray-700 cursor-pointer"
              >
                {typeof t.rentalDetails.amenities === "object" &&
                t.rentalDetails.amenities[amenity]
                  ? t.rentalDetails.amenities[amenity]
                  : amenity}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Owner Details */}
      {showOwnerFields && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4 text-slate-800">
            {t.steps.ownerDetails || "Owner Details"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4">
            {/* Owner Name */}
            <LenaTextField
              label={translateStrict("saleDetails.ownerName")}
              name="owner_name"
              value={commonFormData.owner_name}
              onChange={handleOwnerChange}
              placeholder={translateStrict("saleDetails.ownerName")}
            />

            <PhoneField
              className="w-full"
              name="owner_mobile"
              label={translateStrict("saleDetails.ownerMobile")}
              required={ownerMobileRequired}
              defaultCountry="EG"
              value={commonFormData.owner_mobile ?? ""}
              onChange={(next) => {
                if (invalidFields?.includes("owner_mobile")) {
                  setInvalidFields((prev) => prev.filter((f) => f !== "owner_mobile"));
                }
                updateCommonFormData({ owner_mobile: next ?? "" });
              }}
              error={
                invalidFields?.includes("owner_mobile")
                  ? !String(commonFormData.owner_mobile ?? "").trim()
                    ? translate("phoneField.required", "Phone number is required")
                    : translate("phoneField.invalid", "Invalid phone number")
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
