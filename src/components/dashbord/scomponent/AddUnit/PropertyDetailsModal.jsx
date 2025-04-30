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
import formatDateForDisplay from "@/utils/formateDate";
import { useI18n } from "@/context/translate-api";

const PropertyDetailsModal = ({ onClose, property }) => {
  const { t } = useI18n();

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

  const DetailItem = ({ icon, label, value }) => (
    <div className="flex items-center gap-2">
      <div className="bg-blue-100 p-2 rounded-md">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium">
          {value || t.propertyDetails.notAvailable}
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-opacity-20 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {formattedProperty.user_id}_
            {t.propertyDetails.title.replace("{id}", "")}
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
                <DetailItem
                  icon={<Building2 className="h-5 w-5 text-blue-600" />}
                  label={t.propertyDetails.fields.buildingType}
                  value={formattedProperty.buildingType}
                />

                <DetailItem
                  icon={<Square className="h-5 w-5 text-blue-600" />}
                  label={t.propertyDetails.fields.landArea}
                  value={formattedProperty.land_area}
                />

                <DetailItem
                  icon={<Home className="h-5 w-5 text-blue-600" />}
                  label={t.propertyDetails.fields.floor}
                  value={formattedProperty.floor}
                />

                <DetailItem
                  icon={<Bed className="h-5 w-5 text-blue-600" />}
                  label={t.propertyDetails.fields.roomsCount}
                  value={formattedProperty.roomsCount}
                />

                <DetailItem
                  icon={<Bath className="h-5 w-5 text-blue-600" />}
                  label={t.propertyDetails.fields.bathroomCount}
                  value={formattedProperty.bathroomCount}
                />

                <DetailItem
                  icon={<Eye className="h-5 w-5 text-blue-600" />}
                  label={t.propertyDetails.fields.viewType}
                  value={formattedProperty.viewType}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <DetailItem
                  icon={<Square className="h-5 w-5 text-blue-600" />}
                  label={t.propertyDetails.fields.garageSize}
                  value={formattedProperty.garageSize}
                />

                <DetailItem
                  icon={<Landmark className="h-5 w-5 text-blue-600" />}
                  label={t.propertyDetails.fields.finishingType}
                  value={formattedProperty.finishingType}
                />

                <DetailItem
                  icon={<User className="h-5 w-5 text-blue-600" />}
                  label={t.propertyDetails.fields.developer}
                  value={formattedProperty.developer}
                />

                <DetailItem
                  icon={<DollarSign className="h-5 w-5 text-blue-600" />}
                  label={t.propertyDetails.fields.downPayment}
                  value={formattedProperty.downPayment}
                />

                <DetailItem
                  icon={<Calendar className="h-5 w-5 text-blue-600" />}
                  label={t.propertyDetails.fields.deliveryDate}
                  value={formatDateForDisplay(formattedProperty.deliveryDate, true)}
                />

                <DetailItem
                  icon={<DollarSign className="h-5 w-5 text-blue-600" />}
                  label={t.propertyDetails.fields.totalPrice}
                  value={formattedProperty.totalPrice || "N/A"}
                />
              </div>
            </div>

            {/* Right column - Contact info */}
            <div className="md:w-64 space-y-2">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-blue-800 font-medium">
                    {t.propertyDetails.purchaseProbability}
                  </p>
                  <div className="mt-2">
                    <p className="text-lg font-semibold text-blue-600">
                      {formattedProperty?.score?.score || 0}%
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-blue-200 w-full">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${formattedProperty?.score?.score}%`,
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
                    {t.propertyDetails.fields.propertyPurpose.replace(
                      "{purpose}",
                      formattedProperty.propertyPurpose || "N/A"
                    )}
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
            {t.propertyDetails.buttons.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsModal;