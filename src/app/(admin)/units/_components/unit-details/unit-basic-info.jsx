import UnitAmenities from "./unit-amenities";
import UnitPricing from "./unit-pricing";

export default function UnitBasicInfo({ unit }) {
  return (
    <div className="w-full md:w-1/2 xl:w-2/5">
      <div className="flex items-center">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
          {unit.purpose}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {unit.buildingType.charAt(0).toUpperCase() +
            unit.buildingType.slice(1)}
        </span>
      </div>

      <h1 className="mt-2 text-3xl font-bold text-primary">{unit.unitTitle}</h1>

      <p className="text-lg text-gray-600">
        {unit.compound}, {unit.city}
      </p>

      <UnitPricing unit={unit} />

      {/* Additional Features */}
      <div className="mt-5 grid grid-cols-3 lg:grid-cols-3 gap-x-8 gap-y-2 max-w-lg">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-primary mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <div>
            <span className="text-sm text-gray-500">Developer</span>
            <p className="font-medium">{unit.developer || "N/A"}</p>
          </div>
        </div>

        {unit.purpose === "sell" && (
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-primary mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <span className="text-sm text-gray-500">Delivery Date</span>
              <p className="font-medium">
                {formatDate(unit.deliveryDate) || "N/A"}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-primary mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <div>
            <span className="text-sm text-gray-500">Floor</span>
            <p className="font-medium">{getFloorLabel(unit.floor)}</p>
          </div>
        </div>

        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-primary mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          <div>
            <span className="text-sm text-gray-500">Finishing</span>
            <p className="font-medium">{unit.finishing || "N/A"}</p>
          </div>
        </div>

        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-primary mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7m-6 0H9m6 0l-3-3m3 3l3-3m-3 3l-3-3m0 0L9 4"
            />
          </svg>
          <div>
            <span className="text-sm text-gray-500">Furnishing</span>
            <p className="font-medium">{unit.furnishing || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="mt-5 flex gap-2 items-center">
        {unit.landArea > 0 && (
          <div className="flex flex-col items-center py-1.5 bg-white rounded-md border border-gray-200 h-22 w-24">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="mt-1 text-sm text-gray-500">Area</span>
            <span className="font-medium">{unit.landArea} m²</span>
          </div>
        )}

        <div className="flex flex-col items-center py-1.5 bg-white rounded-md border border-gray-200 h-20 w-24">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span className="mt-1 text-sm text-gray-500">View</span>
          <span className="font-medium">{unit.view || "N/A"}</span>
        </div>

        <div className="flex flex-col items-center py-1.5 bg-white rounded-md border border-gray-200 h-20 w-24">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="mt-1 text-sm text-gray-500">Rooms</span>
          <span className="font-medium">{unit.roomsCount}</span>
        </div>

        <div className="flex flex-col items-center py-1.5 bg-white rounded-md border border-gray-200 h-20 w-24">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="mt-1 text-sm text-gray-500">Bathrooms</span>
          <span className="font-medium">{unit.bathroomCount}</span>
        </div>
      </div>

      {unit.purpose === "rent" && unit?.amenities.length > 0 && (
        <UnitAmenities amenities={unit.amenities} />
      )}
    </div>
  );
}

// Helper functions
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getFloorLabel(floor) {
  if (!floor) return "Ground";
  const floorNum = Number.parseInt(floor);
  if (floorNum === 0) return "Ground";
  if (floorNum === 1) return "1st";
  if (floorNum === 2) return "2nd";
  if (floorNum === 3) return "3rd";
  return `${floorNum}th`;
}
