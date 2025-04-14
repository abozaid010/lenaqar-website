import React from "react";

const PropertySpecificationsSection = ({ formik }) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Property Specifications
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rooms
          </label>
          <input
            type="number"
            name="roomsCount"
            min="0"
            value={formik.values.roomsCount}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value < 0) e.target.value = 0;
              formik.handleChange(e);
            }}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.roomsCount && formik.errors.roomsCount
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent`}
          />
          {formik.touched.roomsCount && formik.errors.roomsCount && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.roomsCount}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bathrooms
          </label>
          <input
            type="number"
            name="bathroomCount"
            min="0"
            value={formik.values.bathroomCount}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value < 0) e.target.value = 0;
              formik.handleChange(e);
            }}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.bathroomCount && formik.errors.bathroomCount
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent`}
          />
          {formik.touched.bathroomCount &&
            formik.errors.bathroomCount && (
              <p className="mt-1 text-sm text-red-500">
                {formik.errors.bathroomCount}
              </p>
            )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Floor
          </label>
          <input
            type="number"
            name="floor"
            min="0"
            value={formik.values.floor}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value < 0) e.target.value = 0;
              formik.handleChange(e);
            }}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.floor && formik.errors.floor
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent`}
          />
          {formik.touched.floor && formik.errors.floor && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.floor}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Land Area (m²)
          </label>
          <input
            type="number"
            name="landArea"
            min="0"
            value={formik.values.landArea}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value < 0) e.target.value = 0;
              formik.handleChange(e);
            }}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.landArea && formik.errors.landArea
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent`}
          />
          {formik.touched.landArea && formik.errors.landArea && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.landArea}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Garden Size (m²)
          </label>
          <input
            type="number"
            name="gardenSize"
            min="0"
            value={formik.values.gardenSize}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value < 0) e.target.value = 0;
              formik.handleChange(e);
            }}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.gardenSize && formik.errors.gardenSize
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent`}
          />
          {formik.touched.gardenSize && formik.errors.gardenSize && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.gardenSize}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Garage Area (m²)
          </label>
          <input
            type="number"
            name="garageArea"
            min="0"
            value={formik.values.garageArea}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value < 0) e.target.value = 0;
              formik.handleChange(e);
            }}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.garageArea && formik.errors.garageArea
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent`}
          />
          {formik.touched.garageArea && formik.errors.garageArea && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.garageArea}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertySpecificationsSection;