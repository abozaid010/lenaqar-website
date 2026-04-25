"use client";

import ImageWithLoader from "@/components/ui/image-with-loader";
import { useI18n } from "@/hooks/useI18n";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { getBuildingTypes } from "@/data/constants";
import { CreditCard, Home, Tag, Edit } from "lucide-react";
import en from "../../../public/locales/en";
import ar from "../../../public/locales/ar";
import { useMemo, useEffect } from "react";

const capitalize = (str) => str?.charAt(0).toUpperCase() + str?.slice(1);

const getPropertyTypeLabel = (value, locale, buildingTypes) => {
  const type = buildingTypes.find((type) => type.value === value);
  return type ? (locale === "ar" ? type.ar_label : type.en_label) : value;
};

const formatPaymentPlan = (plan, locale) => {
  if (typeof plan === "string") {
    return plan;
  }
  if (plan && typeof plan === "object") {
    return plan.name;
  }
  return "";
};

export default function ExistingProjectPreviewDialog({
  isOpen,
  onClose,
  projectData,
  onEdit,
}) {
  const { t, locale } = useI18n();

  // Get building types with translations
  const BUILDING_TYPES = useMemo(() => {
    return getBuildingTypes({
      en: { buildingTypes: en.buildingTypes || {} },
      ar: { buildingTypes: ar.buildingTypes || {} },
    });
  }, []);

  // Handle Escape key - MUST be called before any conditional returns
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!projectData || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="rounded-lg shadow-xl overflow-hidden w-[90%] h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out">
        {/* Custom Header with Red Background */}
        <div className="flex flex-col justify-between items-start p-3 bg-red-600 flex-shrink-0">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-medium text-white">
              {t.formLabels?.existingProject || "Existing Project"}
            </h3>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(projectData)}
                  className="text-white hover:text-gray-200 focus:outline-none p-1 rounded hover:bg-white/10 transition-colors"
                  title={t?.formLabels?.edit}
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-white text-sm mt-2">
            {t.formLabels?.duplicateProjectMessage || "We already have this project in our system. Set project name, city correctly. You can't have two projects with same name in same city."}
          </p>
        </div>
        <div className="p-4 overflow-y-auto bg-white flex-1">
          <div className="space-y-6">
            {/* Master Plan Image */}
            {projectData.master_plan?.url && (
              <div className="relative h-64 w-full rounded-lg overflow-hidden border border-gray-200">
                <ImageWithLoader
                  src={getDisplayImageUrl(projectData.master_plan.url)}
                  alt={projectData.ar_name || projectData.en_name || "Master Plan"}
                  className="w-full h-full object-cover"
                  priority={true}
                  loadingVariant="default"
                />
              </div>
            )}

            {/* Project Names */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-800">
                {t.formLabels?.projectName || "Project Name"}
              </h3>
              <div className="space-y-2">
                {projectData.ar_name && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      {t?.formLabels?.arabic}:
                    </span>
                    <p className="text-lg font-semibold text-gray-900">
                      {projectData.ar_name}
                    </p>
                  </div>
                )}
                {projectData.en_name && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      {t?.formLabels?.english}:
                    </span>
                    <p className="text-lg font-semibold text-gray-900">
                      {projectData.en_name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Location Info */}
            <div className="grid grid-cols-2 gap-4">
              {projectData.city && (
                <div>
                  <span className="text-sm font-medium text-gray-600 block mb-1">
                    {t?.formLabels?.city}
                  </span>
                  <p className="text-base font-semibold text-gray-900">
                    {capitalize(projectData.city)}
                  </p>
                </div>
              )}
              {projectData.district && (
                <div>
                  <span className="text-sm font-medium text-gray-600 block mb-1">
                    {t?.formLabels?.district}
                  </span>
                  <p className="text-base font-semibold text-gray-900">
                    {capitalize(projectData.district)}
                  </p>
                </div>
              )}
            </div>

            {/* Additional Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              {projectData.area && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">
                    {t?.formLabels?.area}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {projectData.area}
                  </span>
                </div>
              )}
              {projectData.delivery_date !== undefined &&
                projectData.delivery_date !== null && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">
                      {t.formLabels?.deliveryInYears || "Delivery (years)"}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {projectData.delivery_date}
                    </span>
                  </div>
                )}
              {projectData.gated !== undefined && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">
                    {t.formLabels?.gatedCommunity || "Gated Community"}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {projectData.gated
                      ? t?.formLabels?.yes
                      : t?.formLabels?.no}
                  </span>
                </div>
              )}
              {projectData.developer_name && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">
                    {t.formLabels?.developer || "Developer"}
                  </span>
                  <span className="text-base font-semibold text-primary truncate">
                    {projectData.developer_name}
                  </span>
                </div>
              )}
            </div>

            {/* Property Types */}
            {projectData.properties_types &&
              projectData.properties_types.length > 0 && (
                <div>
                  <h4 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                    <Home size={20} className="text-blue-600" />
                    {t.formLabels?.propertyTypes || "Property Types"}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {projectData.properties_types.map((type, index) => (
                      <span
                        key={index}
                        className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium rounded-lg flex items-center gap-2"
                      >
                        <Tag size={14} />
                        {getPropertyTypeLabel(type, locale, BUILDING_TYPES)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Payment Plans */}
            {projectData.payment_plans &&
              projectData.payment_plans.length > 0 && (
                <div>
                  <h4 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                    <CreditCard size={20} className="text-green-600" />
                    {t.formLabels?.paymentPlans || "Payment Plans"}
                  </h4>
                  <div className="space-y-2">
                    {projectData.payment_plans.map((plan, index) => (
                      <div
                        key={index}
                        className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-between ${
                          plan.is_default
                            ? "bg-blue-50 border-2 border-blue-300 text-blue-900"
                            : "bg-green-50 border border-green-200 text-green-800"
                        }`}
                      >
                        <span>{formatPaymentPlan(plan, locale)}</span>
                        {plan.is_default && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
                            {t.formLabels?.default || "Default"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Description */}
            {projectData.description && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-lg text-gray-700 mb-2">
                  {t.description || "Description"}
                </h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {projectData.description}
                </p>
              </div>
            )}

            {/* Got it Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                {t.formLabels?.gotIt || "Got it"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
