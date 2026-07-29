'use client';

import type { UnitViewModel } from '@/lib/units/unit-types';
import { useI18n } from '@/hooks/useI18n';

interface UnitPricingSectionProps {
  unit: UnitViewModel;
}

/**
 * Pricing & payment block — same section pattern as location (label/value grid).
 * API keys (SalePropertyDetails): totalPrice, monthlyRentPrice, downPayment,
 * over_price (offer), remaining_amount, installment_years, installment_amount_yearly,
 * paid_amount, deliveryDate, presentValue, pricePerMeter (secondary sale only).
 */
export default function UnitPricingSection({ unit }: UnitPricingSectionProps) {
  const { t, translate } = useI18n();

  const showPresentValue = Boolean(unit.presentValue) && !unit.isPrimary && !unit.monthlyRentPrice;

  const rows = [
    ...(showPresentValue
      ? [
          {
            key: 'presentValue',
            label: translate('unitPricing.presentValue', 'Present value'),
            value: unit.presentValue,
            emphasize: true,
          },
          {
            key: 'pricePerMeter',
            label: translate('unitPricing.pricePerMeter', 'Price / m²'),
            value: unit.pricePerMeter,
            emphasize: false,
          },
        ]
      : []),
    {
      key: 'price',
      label: unit.monthlyRentPrice
        ? translate(
            'rentalDetails.monthlyRentPrice',
            t?.rentalDetails?.monthlyRentPrice || t?.unitPricing?.monthlyRent || 'Monthly rent'
          )
        : translate('unitPricing.totalPrice', t?.unitPricing?.totalPrice || 'Total Price'),
      value: unit.monthlyRentPrice || unit.totalPrice,
      emphasize: !showPresentValue,
    },
    {
      key: 'downPayment',
      label: translate('saleDetails.downPayment', t?.saleDetails?.downPayment || 'Down Payment'),
      value: unit.downPayment,
      emphasize: false,
    },
    {
      key: 'over_price',
      label: translate('saleDetails.over_price', t?.saleDetails?.over_price || 'Over Price'),
      value: unit.overPrice,
      emphasize: false,
    },
    {
      key: 'remaining_amount',
      label: translate(
        'saleDetails.remaining_amount',
        t?.saleDetails?.remaining_amount || 'Remaining Amount'
      ),
      value: unit.remainingAmount,
      emphasize: false,
    },
    {
      key: 'installment_years',
      label: translate(
        'saleDetails.installment_years',
        t?.saleDetails?.installment_years || 'Installment Years'
      ),
      value: unit.installmentYearsLabel,
      emphasize: false,
    },
    {
      key: 'installment_amount_yearly',
      label: translate(
        'saleDetails.installment',
        t?.saleDetails?.installment || t?.unitPricing?.yearlyInstallment || 'Yearly Installment'
      ),
      value: unit.yearlyInstallment,
      emphasize: false,
    },
    {
      key: 'paid_amount',
      label: translate('saleDetails.paid_amount', t?.saleDetails?.paid_amount || 'Paid Amount'),
      value: unit.paidAmount,
      emphasize: false,
    },
    {
      key: 'delivery',
      label: translate(
        'unitPricing.expectedDelivery',
        t?.unitPricing?.expectedDelivery || 'Expected Delivery'
      ),
      value: unit.deliveryDateLabel,
      emphasize: false,
    },
  ].filter((row) => row.value);

  if (rows.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {translate('unitPricing.title', t?.unitPricing?.title || 'Pricing & Payment')}
      </h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rows.map((row) => (
          <div key={row.key}>
            <dt className="text-sm text-gray-600">{row.label}</dt>
            <dd
              className={
                row.emphasize
                  ? 'text-base font-semibold text-gray-900 mt-1'
                  : 'text-sm font-medium text-gray-900 mt-1'
              }
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
