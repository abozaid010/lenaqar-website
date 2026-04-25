import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import type { UnitPricingCardProps } from '@/lib/units/unit-types';
import { useI18n } from '@/context/translate-api';

export default function UnitPricingCard({ unit }: UnitPricingCardProps) {
  const { t } = useI18n();
  const hasPricing = unit.totalPrice || unit.downPayment || unit.yearlyInstallment;
  
  if (!hasPricing) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">{t?.unitPricing?.title || "Pricing & Payment"}</h2>
      </div>

      {/* Total Price */}
      {unit.totalPrice && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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

      {/* Delivery Date */}
      {unit.deliveryDateLabel && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Calendar className="w-4 h-4" />
            {t?.unitPricing?.expectedDelivery || "Expected Delivery"}
          </div>
          <div className="text-lg font-semibold text-gray-900">{unit.deliveryDateLabel}</div>
        </div>
      )}
    </div>
  );
}
