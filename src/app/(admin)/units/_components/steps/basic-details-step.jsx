"use client";
import { useI18n } from "@/context/translate-api";

import AddCompoundDialog from "../add-compound-dialog";
import { useState } from "react";

export default function BasicDetailsStep({
  clientId,
  formData,
  updateFormData,
  compoundsData,
  developers,
  setDevelopers = () => {},
  invalidFields = [],
  setInvalidFields = () => {},
}) {
  const [compounds, setCompounds] = useState(compoundsData || []);
  const [isAddCompoundDialogOpen, setIsAddCompoundDialogOpen] = useState(false);

 const data = [
  {
    "governorate": "Cairo",
    "areas": [
      { "area": "Heliopolis", "compounds": ["Korba Heights", "Heliopolis Gardens", "El Shams Compound", "Al Masa Residence"] },
      { "area": "Nasr City", "compounds": ["Nasr Gardens", "Nasr City Towers", "El Waha Compound"] },
      { "area": "Maadi", "compounds": ["Maadi Gardens", "Sarayat Maadi Residences", "Degla Palms"] },
      { "area": "Zamalek", "compounds": ["Zamalek Tower", "Nile View Residence", "Gezira Heights"] },
      { "area": "Downtown Cairo", "compounds": ["The Nile Ritz-Carlton Residences", "Downtown Heights", "Cairo Downtown Residences"] },
      { "area": "Fifth Settlement", "compounds": ["Katameya Heights", "Lake View Residence", "The Waterway", "Eastown", "Galleria Moon Valley", "El Patio 1", "La Mirada", "Zizinia Gardens", "Stone Residence", "Mountain View II"] },
      { "area": "New Cairo City", "compounds": ["Mivida", "Villette", "Hyde Park", "Swan Lake Residence", "Mountain View I", "Palm Hills New Cairo", "Lake View", "Katameya Dunes", "Sarai", "La Vista City", "El Patio 7", "Layan", "Azad", "Zed East", "Taj City", "Fifth Square", "District 5", "City Gate", "Azzar New Cairo", "Mountain View Hyde Park", "Mountain View iCity"] },
      { "area": "Al Rehab City", "compounds": ["Al Rehab 1", "Al Rehab 2"] },
      { "area": "Madinaty", "compounds": ["Madinaty"] },
      { "area": "New Administrative Capital", "compounds": ["Vinci", "The Loft", "De Joya", "Capital Heights", "Oblisco Capitale", "Jnoub", "Bleu Vert", "Rhodes", "Rivan", "Oia", "Atika", "Talah", "Il Bosco", "Midtown Sky", "Midtown Condo", "Midtown Solo", "Midtown Villa", "Midtown Capital", "La Verde", "Scenario", "Entrada", "Castle Landmark", "Capital Gardens", "Pukka", "Anakaji", "The City", "Catalan", "Green Avenue", "Botanica", "Zed New Capital"] }
    ]
  },
  {
    "governorate": "Giza",
    "areas": [
      { "area": "Sheikh Zayed", "compounds": ["Beverly Hills", "Allegria", "Zed Towers", "Etapa", "Karma Residence", "Casa", "The Courtyards", "Greens Compound", "El Rabwa"] },
      { "area": "Dokki", "compounds": ["Dokki Gardens", "El Nile Compound"] },
      { "area": "Mohandessin", "compounds": ["Mohandessin Heights", "El Mohandessin Towers"] }
    ]
  },
  {
    "governorate": "6th of October",
    "areas": [
      { "area": "6th of October City", "compounds": ["Palm Hills October", "Mountain View Chillout Park", "Mountain View iCity October", "New Giza", "The Crown", "Beta Greens", "El Patio 6", "Joulz", "O West", "Grand Heights", "Brix", "Badya"] }
    ]
  },
  {
    "governorate": "Alexandria",
    "areas": [
      { "area": "Smouha", "compounds": ["Terrace Smouha", "Green Smouha Compound", "Skyline Smouha"] },
      { "area": "San Stefano", "compounds": ["San Stefano Grand Plaza", "San Stefano Towers"] },
      { "area": "Gleem", "compounds": ["Gleem Bay", "Gleem Residence"] },
      { "area": "Sawary", "compounds": ["Sawary Compound", "Vee Sawary"] },
      { "area": "Miami", "compounds": ["Miami Grand Plaza", "Miami Heights"] },
      { "area": "Sidi Gaber", "compounds": ["Sidi Gaber Towers", "Sidi Gaber Residence"] },
      { "area": "Other Areas", "compounds": ["Palm Hills Alexandria", "Cleopatra Plaza", "Antoniadis Compound", "Royal Plaza Compound", "Karma Compound", "Safwa Towers Compound"] }
    ]
  },
  {
    "governorate": "Red Sea",
    "areas": [
      { "area": "Hurghada", "compounds": ["Ocean Breeze", "Magawish Resort", "Turtles Beach Resort", "Azzurra Sahl Hasheesh", "Veranda Sahl Hasheesh", "La Quinta Resort", "Aqua Blue Bay", "Makadi Heights", "Soma Bay", "El Gouna"] }
    ]
  },
  {
    "governorate": "Matrouh",
    "areas": [
      { "area": "North Coast", "compounds": ["Marassi", "Hacienda Bay", "La Vista Bay", "Fouka Bay", "Mountain View Ras El Hikma", "Jefaira", "Amwaj", "Bo Islands", "Telal", "Malaaz", "Seashell", "Diplomats 3", "Zahra", "SouthMED", "Blue Park", "Caesar Bay", "Sidi Abdel Rahman", "Ras El Hekma", "Silver Sands", "Salt", "Q North Coast", "June by SODIC", "Hacienda West", "The Med", "Mar Bay", "Zoya", "Cecilia Lagoons", "Marsa Baghush", "Ajar Resort", "Katameya Coast", "Marseilia Beach", "Golf Porto Marina", "White Bay", "White Sand", "La Vista Ras El Hekma", "North Edge Towers", "City Stars Al Sahel", "La Vista Cascada", "Mountain View Diplomats", "Bianchi", "Gaia", "Kai Sahel", "Sea View", "Blue Blue Ras El Hekma", "Ein Hills", "La Vista Gardens", "Mountain View North Coast", "Marina Wadi Degla", "Marina El Alamein"] },
      { "area": "El Alamein", "compounds": ["Palm Hills New Alamein", "Il Latini", "North Edge Towers", "Mazarine", "Downtown New Alamein", "Bo Sands", "Alma New Alamein", "Glee North Coast", "North Towers", "Latin District", "Winter New Alamein", "El Alamein Capital", "La Capital New Alamein", "Alamein Towers", "Alma Village", "City Edge Towers", "The Gate Towers", "New Alamein Gardens", "Alamein Hills", "Alamein Heights", "Alamein Residences", "Alamein View", "Alamein Plaza", "Alamein Park", "Alamein Bay", "Alamein Lagoon", "Alamein Marina", "Alamein Beach", "Alamein Coast", "Alamein Pearl", "Alamein Star", "Alamein Sky", "Alamein Horizon", "Alamein Breeze", "Alamein Oasis", "Alamein Valley", "Alamein Creek", "Alamein Forest", "Alamein Summit", "Alamein Vista", "Alamein Zenith", "Alamein Nova", "Alamein Aura", "Alamein Lumina", "Alamein Solis", "Alamein Terra", "Alamein Vibe", "Alamein Wave"] }
    ]
  },
  {
    "governorate": "New Administrative Capital",
    "areas": [
      { "area": "R7", "compounds": ["Midtown Sky", "The City", "Capital Heights", "La Vista City", "Anakaji", "Oia Compound"] },
      { "area": "R8", "compounds": ["Sky Capital", "The Curve", "Residence Eight", "Scenario", "De Joya"] }
    ]
  }
]


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

  const { t } = useI18n();

  const handleAddCompound = (newCompound) => {
    // Add the new compound to the list
    setCompounds([...compounds, newCompound]);

    updateFormData({ project: newCompound.name });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3 text-slate-800">
        {t.basicDetails.propertyDetails}
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
            {t.basicDetails.unitTitle} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="unitTitle"
            required
            value={formData.unitTitle}
            onChange={handleChange}
            placeholder={t.basicDetails.placeholders.unitTitle}
            className={`block w-full rounded-md border py-1 px-3 focus:outline-none focus:ring-1 ${
              invalidFields.includes("unitTitle")
                ? "border-red-500 ring-red-500 placeholder-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
          />
        </div>

        {/* Compound */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.basicDetails.compound}
          </label>
          <select
            name="project"
            value={formData.project}
            onChange={handleChange}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t.basicDetails.selectCompound}</option>
            {compounds.map((project) => (
              <option key={`${project.id}-${project.name}`} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
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
            {t.basicDetails.buildingType}
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
              <option value="apartment">
                {t.basicDetails.buildingTypes.apartment}
              </option>
              <option value="villa">
                {t.basicDetails.buildingTypes.villa}
              </option>
              <option value="townhouse">
                {t.basicDetails.buildingTypes.townhouse}
              </option>
              <option value="duplex">
                {t.basicDetails.buildingTypes.duplex}
              </option>
              <option value="penthouse">
                {t.basicDetails.buildingTypes.penthouse}
              </option>
              <option value="studio">
                {t.basicDetails.buildingTypes.studio}
              </option>
              <option value="chalet">
                {t.basicDetails.buildingTypes.chalet}
              </option>
              <option value="office">
                {t.basicDetails.buildingTypes.office}
              </option>
              <option value="shop">{t.basicDetails.buildingTypes.shop}</option>
              <option value="twinhouse">
                {t.basicDetails.buildingTypes.twinhouse}
              </option>
              <option value="house">
                {t.basicDetails.buildingTypes.house}
              </option>
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
            {t.basicDetails.purpose} <span className="text-red-500">*</span>
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
              <option value="">{t.basicDetails.selectPurpose}</option>
              <option value="sell">{t.basicDetails.purposes.sell}</option>
              <option value="rent">{t.basicDetails.purposes.rent}</option>
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
            {t.basicDetails.city} <span className="text-red-500">*</span>
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
              <option value="">{t.basicDetails.selectCity}</option>
              {data.map((item) => (
                <option key={item.governorate} value={item.governorate}>
                  {item.governorate}
                </option>
              ))}
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
            {t.basicDetails.view} <span className="text-red-500">*</span>
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
              <option value="">{t.basicDetails.selectView}</option>
              <option value="park">{t.basicDetails.views.park}</option>
              <option value="street">{t.basicDetails.views.street}</option>
              <option value="lagoon">{t.basicDetails.views.lagoon}</option>
              <option value="sea">{t.basicDetails.views.sea}</option>
              <option value="city">{t.basicDetails.views.city}</option>
              <option value="river">{t.basicDetails.views.river}</option>
              <option value="pool">{t.basicDetails.views.pool}</option>
              <option value="golf">{t.basicDetails.views.golf}</option>
              <option value="garden">{t.basicDetails.views.garden}</option>
              <option value="open area">{t.basicDetails.views.openArea}</option>
              <option value="mountain">{t.basicDetails.views.mountain}</option>
            </select>
          </div>
        </div>

        {/* District */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.basicDetails.district}
          </label>
          <select
            name="district"
            value={formData.district}
            onChange={handleChange}
            className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder={formData.city ? "select district" : "Please select city first"}
          >
            <option value="" disabled>
              {formData.city ? "select district" : "Please select city first"}
            </option>
            {formData.city && data.find(item => item.governorate === formData.city)?.areas.map(area => (
              <option key={area.area} value={area.area}>
                {area.area}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-3 mt-8 text-slate-800">
        {t.basicDetails.propertySpecs}
      </h3>

      <div className="grid grid-cols-2 gap-x-2 md:grid-cols-3 gap-y-3 md:gap-x-4">
        {/* Rooms */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("roomsCount")
                ? "text-red-500 "
                : "text-gray-700"
            }`}
          >
            {t.basicDetails.rooms} <span className="text-red-500">*</span>
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
            {t.basicDetails.bathrooms} <span className="text-red-500">*</span>
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
            {t.basicDetails.floor}
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
            {t.basicDetails.landArea} (m²)
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
            {t.basicDetails.gardenSize} (m²)
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
            {t.basicDetails.garageArea} (m²)
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

      {/* Add Compound Dialog */}
      <AddCompoundDialog
        clientId={clientId}
        developers={developers}
        setDevelopers={setDevelopers}
        isOpen={isAddCompoundDialogOpen}
        onClose={() => setIsAddCompoundDialogOpen(false)}
        onAdd={handleAddCompound}
      />
    </div>
  );
}
