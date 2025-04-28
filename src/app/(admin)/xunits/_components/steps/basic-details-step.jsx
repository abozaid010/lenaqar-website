"use client";

export default function BasicDetailsStep({
  formData,
  updateFormData,
  compounds,
}) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      updateFormData({ [name]: checked });
    } else {
      updateFormData({ [name]: value });
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3 text-slate-800">
        Property Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-4">
        {/* Unit Title */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="unitTitle"
            required
            value={formData.unitTitle}
            onChange={handleChange}
            placeholder="Enter unit title"
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Compound */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Compound <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="compound"
              required
              value={formData.compound}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">Select compound</option>
              {compounds.map((compound) => (
                <option key={compound.id} value={compound.name}>
                  {compound.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <button
            type="button"
            className="absolute right-0 top-0 text-blue-600 text-sm font-medium"
          >
            + Add New
          </button>
        </div>

        {/* Building Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Building Type
          </label>
          <div className="relative">
            <select
              name="buildingType"
              value={formData.buildingType}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="townhouse">Townhouse</option>
              <option value="duplex">Duplex</option>
              <option value="penthouse">Penthouse</option>
              <option value="studio">Studio</option>
              <option value="chalet">Chalet</option>
              <option value="office">Office</option>
              <option value="shop">Shop</option>
              <option value="twinhouse">Twinhouse</option>
              <option value="house">House</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purpose <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="purpose"
              required
              value={formData.purpose}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">Select purpose</option>
              <option value="sell">Sell</option>
              <option value="rent">Rent</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="city"
              value={formData.city}
              required
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">Select city</option>
              <option value="Cairo">Cairo</option>
              <option value="Alexandria">Alexandria</option>
              <option value="Giza">Giza</option>
              <option value="New Cairo">New Cairo</option>
              <option value="6th of October">6th of October</option>
              <option value="El Shorouk">El Shorouk</option>
              <option value="Sheikh Zayed">Sheikh Zayed</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* View */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            View <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="view"
              value={formData.view}
              required
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">Select view</option>
              <option value="park">Park</option>
              <option value="street">Street</option>
              <option value="lagoon">Lagoon</option>
              <option value="sea">Sea</option>
              <option value="city">City</option>
              <option value="river">River</option>
              <option value="pool">Pool</option>
              <option value="golf">Golf</option>
              <option value="garden">Garden</option>
              <option value="open area">Open Area</option>
              <option value="mountain">Mountain</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* District */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            District
          </label>
          <input
            type="text"
            name="district"
            value={formData.district}
            onChange={handleChange}
            placeholder="district name"
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-3 mt-8 text-slate-800">
        Property Specifications
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-4">
        {/* Rooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rooms <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="roomsCount"
            value={+formData.roomsCount}
            onChange={handleChange}
            min={0}
            required
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Bathrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bathrooms <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="bathroomCount"
            value={+formData.bathroomCount}
            onChange={handleChange}
            min={0}
            required
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Floor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Floor
          </label>
          <input
            type="number"
            name="floor"
            value={+formData.floor}
            onChange={(e) => updateFormData({ floor: e.target.value })}
            min={0}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Land Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Land Area (m²)
          </label>
          <input
            type="number"
            name="landArea"
            value={formData.landArea}
            onChange={handleChange}
            min={0}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Garden Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Garden Size (m²)
          </label>
          <input
            type="number"
            name="gardenSize"
            value={formData.gardenSize}
            onChange={handleChange}
            min={0}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Garage Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Garage Area (m²)
          </label>
          <input
            type="number"
            name="garageArea"
            value={formData.garageArea}
            onChange={handleChange}
            min="0"
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
