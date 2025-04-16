import React from "react";
import propertyEnums from "../../data/propertyEnums.json";

const AdditionalDetailsSection = ({
  formik,
  developersData,
  isDevDropdownOpen,
  setIsDevDropdownOpen,
  setIsAddDeveloperModalOpen,
}) => {
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
            value={formik.values.finishing}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 rounded-lg border ${
              formik.touched.finishing && formik.errors.finishing
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-primary"
            } focus:border-transparent`}
          >
            <option value="">Select Finishing</option>
            {propertyEnums.EnumFinishingType.map((finishing, index) => (
              <option key={index} value={finishing}>
                {finishing.charAt(0).toUpperCase() + finishing.slice(1)}
              </option>
            ))}
          </select>
          {formik.touched.finishing && formik.errors.finishing && (
            <p className="mt-1 text-sm text-red-500">
              {formik.errors.finishing}
            </p>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Developer
            </label>
            <button
              type="button"
              onClick={() => setIsAddDeveloperModalOpen(true)}
              className="text-xs text-primary hover:text-primary/80 mb-1"
            >
              + Add New
            </button>
          </div>

          <div className="relative">
            <div
              className={`w-full px-4 py-2 rounded-lg border ${
                formik.touched.developer && formik.errors.developer
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-primary"
              } focus:border-transparent cursor-pointer flex justify-between items-center`}
              onClick={() => setIsDevDropdownOpen(!isDevDropdownOpen)}
            >
              <span>{formik.values.developer || "Select Developer"}</span>
              <span>{isDevDropdownOpen ? "▲" : "▼"}</span>
            </div>

            {isDevDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {developersData &&
                  developersData.map((developer, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        formik.setFieldValue("developer", developer.name);
                        formik.setFieldTouched("developer", true, false); // Set touched but don't validate yet
                        setIsDevDropdownOpen(false);
                        // Manually validate the form after setting the value
                        setTimeout(() => {
                          formik.validateForm().then(() => {
                            formik.setFieldError("developer", undefined); // Clear any error for developer
                          });
                        }, 0);
                      }}
                    >
                      {developer.name}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <input
            type="hidden"
            name="developer"
            value={formik.values.developer}
          />
        </div>

        <input
          type="hidden"
          name="dataSource"
          value={formik.values.dataSource || "website"}
        />
      </div>
    </div>
  );
};

export default AdditionalDetailsSection;
