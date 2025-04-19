import React from "react";
import {
  X,
  Home,
  Square,
  Building2,
  Bath,
  Bed,
  Eye,
  Landmark,
  Calendar,
  DollarSign,
  User,
  Phone,
} from "lucide-react";

const PropertyDetailsModal = ({ onClose, property }) => {
  const reformatPropertyData = () => {
    const reformattedData = {};

    for (const key in property) {
      const value = property[key];
      reformattedData[key] = Array.isArray(value)
        ? value[value.length - 1]
        : value;
    }

    return reformattedData;
  };

  const formattedProperty = reformatPropertyData();

  return (
    <div className="fixed inset-0  bg-opacity-20 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {formattedProperty.user_id}_Requirements
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Left column - Property details */}
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-md">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Building Type</p>
                    <p className="text-sm font-medium">
                      {formattedProperty.buildingType || "-----"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-md">
                    <Square className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Land Area</p>
                    <p className="text-sm font-medium">
                      {formattedProperty.land_area || "-----"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-md">
                    <Home className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Floor</p>
                    <p className="text-sm font-medium">
                      {formattedProperty.floor || "-----"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-md">
                    <Bed className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rooms Count</p>
                    <p className="text-sm font-medium">
                      {formattedProperty.roomsCount || "----"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-md">
                    <Bath className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bathroom Count</p>
                    <p className="text-sm font-medium">
                      {formattedProperty.bathroomCount || "-----"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-md">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">View</p>
                    <p className="text-sm font-medium">
                      {formattedProperty.viewType || "-----"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-md">
                    <Square className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Garden Size</p>
                    <p className="text-sm font-medium">
                      {formattedProperty.garageSize || "-----"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-md">
                    <Landmark className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Finishing</p>
                    <p className="text-sm font-medium">
                      {formattedProperty.finishingType || "-----"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-md">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Developer</p>
                    <p className="text-sm font-medium">
                      {formattedProperty.developer || "-----"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-md">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Down Payment</p>
                    <p className="text-sm font-medium">
                      {formattedProperty.downPayment || "-----"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-md">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Delivery Year</p>
                    <p className="text-sm font-medium">
                      {formattedProperty.deliveryDate || "-----"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-md">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Price</p>
                    <p className="text-sm font-medium">
                      {formattedProperty.totalPrice || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Contact info */}
            <div className="md:w-64 space-y-2">
              {/* <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">
                    {formattedProperty.contactName}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {property.lastUpdate}
                  </p>
                </div>
              </div> */}

              {/* Added Purchase Probability Section */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-blue-800 font-medium">
                    Purchase Probability
                  </p>
                  <div className="mt-2">
                    <p className="text-lg font-semibold text-blue-600">
                      {formattedProperty.purchaseProbability || 0}%
                    </p>
                    <div
                      className="mt-2 h-2 rounded-full bg-blue-200"
                      style={{
                        width: "100%",
                      }}
                    >
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${formattedProperty.purchaseProbability}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-center">
                  <div className="inline-block bg-blue-100 p-2 rounded-full mb-2">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-blue-800 font-medium">
                    For {formattedProperty.propertyPurpose || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsModal;
