import Link from 'next/link';
import { MapPin, Building, User, Tag, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import type { UnitHeaderSummaryProps } from '@/lib/units/unit-types';
import { useI18n } from '@/hooks/useI18n';

export default function UnitHeaderSummary({ unit }: UnitHeaderSummaryProps) {
  const { t } = useI18n();
  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          {unit.title || `${unit.buildingType || 'Property'} Details`}
        </h1>
        
        {/* Project and Developer Links */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {unit.projectHref && unit.projectName && (
            <Link 
              href={unit.projectHref}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Building className="w-4 h-4" />
              {unit.projectName}
            </Link>
          )}
          {unit.projectName && !unit.projectHref && (
            <span className="flex items-center gap-1 text-gray-600">
              <Building className="w-4 h-4" />
              {unit.projectName}
            </span>
          )}

          {unit.developerHref && unit.developerName && (
            <Link 
              href={unit.developerHref}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <User className="w-4 h-4" />
              {unit.developerName}
            </Link>
          )}
          {unit.developerName && !unit.developerHref && (
            <span className="flex items-center gap-1 text-gray-600">
              <User className="w-4 h-4" />
              {unit.developerName}
            </span>
          )}
        </div>
      </div>

      {/* Location */}
      {unit.locationLabel && (
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-5 h-5" />
          <span className="text-lg">{unit.locationLabel}</span>
        </div>
      )}

      {/* Key Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Building Type */}
        {unit.buildingType && (
          <div className="space-y-1">
            <div className="text-sm text-gray-600">{t?.unitHeader?.propertyType || "Property Type"}</div>
            <div className="text-lg font-semibold text-gray-900">{unit.buildingType}</div>
          </div>
        )}

        {/* Delivery Date */}
        {unit.deliveryDateLabel && (
          <div className="space-y-1">
            <div className="text-sm text-gray-600">{t?.unitPricing?.expectedDelivery || "Delivery"}</div>
            <div className="text-lg font-semibold text-gray-900">{unit.deliveryDateLabel}</div>
          </div>
        )}

              </div>

      {/* Pricing & Payment Information */}
      {(unit.totalPrice || unit.downPayment || unit.yearlyInstallment || unit.monthlyInstallmentEstimate || unit.installmentYearsLabel) && (
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t?.unitPricing?.title || "Pricing & Payment"}</h3>
          </div>
          
          {/* Total Price - Highlight */}
          {unit.totalPrice && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="text-sm text-blue-600 font-medium mb-1">{t?.unitPricing?.totalPrice || "Total Price"}</div>
              <div className="text-2xl lg:text-3xl font-bold text-blue-900">{unit.totalPrice}</div>
            </div>
          )}

          {/* Payment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Down Payment */}
            {unit.downPayment && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{t?.unitPricing?.downPayment || "Down Payment"}</div>
                <div className="text-xl font-semibold text-gray-900">{unit.downPayment}</div>
              </div>
            )}

            {/* Installment Period */}
            {unit.installmentYearsLabel && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  {t?.unitPricing?.installmentPeriod || "Installment Period"}
                </div>
                <div className="text-xl font-semibold text-gray-900">{unit.installmentYearsLabel}</div>
              </div>
            )}

            {/* Yearly Installment */}
            {unit.yearlyInstallment && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{t?.unitPricing?.yearlyInstallment || "Yearly Installment"}</div>
                <div className="text-xl font-semibold text-gray-900">{unit.yearlyInstallment}</div>
              </div>
            )}

            {/* Monthly Estimate */}
            {unit.monthlyInstallmentEstimate && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  {t?.unitPricing?.monthlyEstimate || "Monthly (Est.)"}
                </div>
                <div className="text-xl font-semibold text-gray-900">{unit.monthlyInstallmentEstimate}</div>
                <div className="text-xs text-gray-500 mt-1">{t?.unitPricing?.estimatedMonthlyAmount || "Estimated monthly amount"}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Badges */}
      {unit.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {unit.badges.map((badge, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              {badge}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
