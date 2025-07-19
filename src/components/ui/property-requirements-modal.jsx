"use client";

import { useI18n } from "@/context/translate-api";
import { formatDateForDisplay } from "@/utils/formateDate";
import {
  Bath,
  Bed,
  Building2,
  Calendar,
  DollarSign,
  Eye,
  Home,
  Landmark,
  MapPin,
  Square,
  Tag,
  User,
  X,
} from "lucide-react";

const PropertyDetailsModal = ({ onClose, property }) => {
  const { t } = useI18n();

  const reformatPropertyData = () => {
    const reformattedData = { ...property };

    const cleanedData = Object.fromEntries(
      Object.entries(reformattedData).filter(([key]) => !key.startsWith("user"))
    );

    for (const key in cleanedData) {
      const value = cleanedData[key];
      if (Array.isArray(value)) {
        cleanedData[key] = value[value.length - 1];
      }
    }

    return cleanedData;
  };

  const formattedProperty = reformatPropertyData();

  // Modified DetailItem to only render when value exists
  const DetailItem = ({ icon, label, value }) => {
    // Skip rendering if value is null, undefined, empty string or N/A
    if (!value || value === "" || value === "N/A") {
      return null;
    }

    return (
      <div className="flex items-center gap-2">
        <div className="bg-blue-100 p-1 rounded-md">{icon}</div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xs font-medium">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {formattedProperty.name ||
              formattedProperty.phone ||
              t.clientsTable.newLead}
            {"_"}
            {t.propertyDetails.title}
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
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Left column - Property details */}
            <div className="md:w-1/2 w-full">
              <h4 className="text-md font-medium text-gray-900 mb-3">
                {t.propertyDetails.propertyInfo || "Property Information"}
              </h4>

              {/* Location Information */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {t.propertyDetails.location || "Location"}
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem
                    icon={<MapPin size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.country || "Country"}
                    value={formattedProperty.country}
                  />
                  <DetailItem
                    icon={<MapPin size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.city || "City"}
                    value={formattedProperty.city}
                  />
                  <DetailItem
                    icon={<MapPin size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.district || "District"}
                    value={formattedProperty.district}
                  />
                  <DetailItem
                    icon={<Tag size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.project || "Project"}
                    value={formattedProperty.project}
                  />
                </div>
              </div>

              {/* Basic Property Details */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {t.propertyDetails.basicDetails || "Basic Details"}
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem
                    icon={<Building2 size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.buildingType}
                    value={formattedProperty.buildingType}
                  />
                  <DetailItem
                    icon={<Home size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.floor}
                    value={formattedProperty.floor}
                  />
                  <DetailItem
                    icon={<Bed size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.roomsCount}
                    value={formattedProperty.roomsCount}
                  />
                  <DetailItem
                    icon={<Bath size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.bathroomCount}
                    value={formattedProperty.bathroomCount}
                  />
                </div>
              </div>

              {/* Financial Information */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {t.propertyDetails.financialDetails || "Financial Details"}
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem
                    icon={<DollarSign size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.totalPrice}
                    value={formattedProperty.totalPrice}
                  />
                  <DetailItem
                    icon={<DollarSign size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.downPayment}
                    value={formattedProperty.downPayment}
                  />
                  <DetailItem
                    icon={<DollarSign size={18} className="text-primary" />}
                    label={
                      t.propertyDetails.fields.serviceCharges ||
                      "Service Charges"
                    }
                    value={formattedProperty.serviceCharges}
                  />
                  {formattedProperty.deliveryDate && (
                    <DetailItem
                      icon={<Calendar size={18} className="text-primary" />}
                      label={t.propertyDetails.fields.deliveryDate}
                      value={formatDateForDisplay(
                        formattedProperty.deliveryDate,
                        false
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right column - Additional details & score */}
            <div className="md:w-1/2 w-full">
              <h4 className="text-md font-medium text-gray-900 mb-3">
                {t.propertyDetails.additionalInfo || "Additional Information"}
              </h4>

              {/* Property Features */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {t.propertyDetails.features || "Features"}
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem
                    icon={<Square size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.landArea}
                    value={formattedProperty.land_area}
                  />
                  <DetailItem
                    icon={<Square size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.gardenSize || "Garden Size"}
                    value={formattedProperty.gardenSize}
                  />
                  <DetailItem
                    icon={<Square size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.garageSize}
                    value={formattedProperty.garageSize}
                  />
                  <DetailItem
                    icon={<Eye size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.viewType}
                    value={formattedProperty.viewType}
                  />
                  <DetailItem
                    icon={<Landmark size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.finishingType}
                    value={formattedProperty.finishingType}
                  />
                  <DetailItem
                    icon={<User size={18} className="text-primary" />}
                    label={t.propertyDetails.fields.developer}
                    value={formattedProperty.developer}
                  />
                </div>
              </div>

              {/* Property Purpose and Usage */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {t.propertyDetails.purpose || "Purpose & Usage"}
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem
                    icon={<Tag size={18} className="text-primary" />}
                    label={
                      t.propertyDetails.fields.propertyPurpose ||
                      "Property Purpose"
                    }
                    value={formattedProperty.propertyPurpose}
                  />
                  <DetailItem
                    icon={<Tag size={18} className="text-primary" />}
                    label={
                      t.propertyDetails.fields.propertyUsage || "Property Usage"
                    }
                    value={formattedProperty.propertyUsage}
                  />
                  <DetailItem
                    icon={<Tag size={18} className="text-primary" />}
                    label={
                      t.propertyDetails.fields.propertyIntent ||
                      "Property Intent"
                    }
                    value={formattedProperty.propertyIntent}
                  />
                  <DetailItem
                    icon={<Tag size={18} className="text-primary" />}
                    label={
                      t.propertyDetails.fields.propertyStatus ||
                      "Property Status"
                    }
                    value={formattedProperty.propertyStatus}
                  />
                </div>
              </div>

              {/* Score display */}
              {formattedProperty?.score?.score !== undefined &&
                formattedProperty?.score?.score !== null && (
                  <div className="bg-blue-50 p-3 rounded-lg mt-4">
                    <div className="text-center">
                      <p className="text-sm text-primary font-medium">
                        {t.propertyDetails.purchaseProbability}
                      </p>
                      <div className="mt-2">
                        <p className="text-lg font-semibold text-primary">
                          {formattedProperty.score.score}%
                        </p>
                        <div className="mt-2 h-2 rounded-full bg-blue-200 w-full">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${formattedProperty.score.score}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Deal breakers if any */}
              {formattedProperty.dealBreakers && (
                <div className="bg-red-50 p-3 rounded-lg mt-3">
                  <p className="text-sm font-medium text-red-700">
                    {t.propertyDetails.dealBreakers || "Deal Breakers"}
                  </p>
                  <p className="text-sm mt-1">
                    {formattedProperty.dealBreakers}
                  </p>
                </div>
              )}

              {/* Additional features if any */}
              {formattedProperty.additionalFeatures && (
                <div className="bg-green-50 p-3 rounded-lg mt-3">
                  <p className="text-sm font-medium text-green-700">
                    {t.propertyDetails.additionalFeatures ||
                      "Additional Features"}
                  </p>
                  <p className="text-sm mt-1">
                    {formattedProperty.additionalFeatures}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsModal;
