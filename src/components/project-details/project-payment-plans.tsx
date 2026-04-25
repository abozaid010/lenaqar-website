'use client';

import { useI18n } from '@/hooks/useI18n';
import type { ProjectViewModel } from '@/lib/projects/project-types';

interface Props {
  project: ProjectViewModel;
}

export default function ProjectPaymentPlans({ project }: Props) {
  const { t } = useI18n();
  const plans = project.paymentPlanDetails;
  if (!plans || plans.length === 0) return null;

  const yrsLabel = t?.projectPage?.years || 'yrs';

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {t?.projectPage?.paymentPlans || 'Payment Plans'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map((plan, i) => (
          <div
            key={plan.id || i}
            className={`rounded-lg border p-4 space-y-3 ${
              plan.is_default
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            {/* Plan header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">{plan.name}</h3>
              {plan.is_default && (
                <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                  {t?.projectPage?.delivery || 'Default'}
                </span>
              )}
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-md p-2 border border-gray-100">
                <p className="text-xs text-gray-500">{t?.projectPage?.down || 'Down'}</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {plan.downpayment_percentage}%
                </p>
              </div>
              <div className="bg-white rounded-md p-2 border border-gray-100">
                <p className="text-xs text-gray-500">{t?.projectPage?.installmentAbbr || 'Install.'}</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {plan.installment_years} {yrsLabel}
                </p>
              </div>
              <div className="bg-white rounded-md p-2 border border-gray-100">
                <p className="text-xs text-gray-500">{t?.projectPage?.deliver || 'Deliver'}</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {plan.delivery_in_years} {yrsLabel}
                </p>
              </div>
            </div>

            {/* Secondary info */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
              {plan.cache_discount > 0 && (
                <span>{t?.projectPage?.cashDiscount || 'Cash discount'}: {plan.cache_discount}%</span>
              )}
              {plan.maintenance_fee > 0 && (
                <span>{t?.projectPage?.maintenance || 'Maintenance'}: {plan.maintenance_fee}%</span>
              )}
              {plan.installment_increasing_percentage > 0 && (
                <span>{t?.projectPage?.escalation || 'Escalation'}: {plan.installment_increasing_percentage}%</span>
              )}
            </div>

            {plan.description && (
              <p className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                {plan.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
