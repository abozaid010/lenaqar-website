import React from "react";

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
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select Finishing</option>
            <option value="Fully Finished">Fully Finished</option>
            <option value="Semi Finished">Semi Finished</option>
            <option value="Core & Shell">Core & Shell</option>
          </select>
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
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer flex justify-between items-center"
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
                        formik.setFieldTouched("developer", true);
                        setIsDevDropdownOpen(false);
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