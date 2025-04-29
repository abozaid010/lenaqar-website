"use client";

export default function BasicDetailsStep({
  formData,
  updateFormData,
  compounds,
  invalidFields = [],
  setInvalidFields = () => {},
}) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let updatedValue;
    if (type === "checkbox") {
      updatedValue = checked;
    } else if (type === "number") {
      updatedValue = Number(value);
    } else {
      updatedValue = value;
    }

    updateFormData({ [name]: updatedValue });

    if (invalidFields.includes(name) && updatedValue) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
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
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("unitTitle")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            Unit Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="unitTitle"
            required
            value={formData.unitTitle}
            onChange={handleChange}
            placeholder="Enter unit title"
            className={`block w-full rounded-md border py-1 px-3 focus:outline-none focus:ring-1 ${
              invalidFields.includes("unitTitle")
                ? "border-red-500 ring-red-500 placeholder-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
        </div>

        {/* Compound */}
        <div className="relative">
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("compound")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            Compound <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="compound"
              required
              value={formData.compound}
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("compound")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
            >
              <option value="">Select compound</option>
              {compounds.map((compound) => (
                <option key={compound.id} value={compound.name}>
                  {compound.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Building Type */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("buildingType")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            Building Type
          </label>
          <div className="relative">
            <select
              name="buildingType"
              value={formData.buildingType}
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("buildingType")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
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
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("purpose")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            Purpose <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="purpose"
              required
              value={formData.purpose}
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("purpose")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
            >
              <option value="">Select purpose</option>
              <option value="sell">Sell</option>
              <option value="rent">Rent</option>
            </select>
          </div>
        </div>

        {/* City */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("city") ? "text-red-500" : "text-gray-700"
            }`}
          >
            City <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="city"
              value={formData.city}
              required
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("city")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
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
          </div>
        </div>

        {/* View */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("view") ? "text-red-500" : "text-gray-700"
            }`}
          >
            View <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="view"
              value={formData.view}
              required
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 bg-white focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("view")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
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
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("roomsCount")
                ? "text-red-500 "
                : "text-gray-700"
            }`}
          >
            Rooms <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="roomsCount"
            value={formData.roomsCount}
            placeholder="0"
            onChange={handleChange}
            min="0"
            required
            className={`block w-full rounded-md border py-1 px-3 focus:outline-none focus:ring-1 ${
              invalidFields.includes("roomsCount")
                ? "border-red-500 ring-red-500 placeholder-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
        </div>

        {/* Bathrooms */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("bathroomCount")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            Bathrooms <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="bathroomCount"
            placeholder="0"
            value={formData.bathroomCount}
            onChange={handleChange}
            min={0}
            required
            className={`block w-full rounded-md border py-1 px-3 focus:outline-none focus:ring-1 ${
              invalidFields.includes("bathroomCount")
                ? "border-red-500 ring-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
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
            value={formData.floor}
            placeholder="0"
            onChange={handleChange}
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
            placeholder="0"
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
            placeholder="0"
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
            placeholder="0"
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
