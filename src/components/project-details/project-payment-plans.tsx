import type { ProjectViewModel } from '@/lib/projects/project-types';

interface Props {
  project: ProjectViewModel;
}

export default function ProjectPaymentPlans({ project }: Props) {
  const plans = project.paymentPlanDetails;
  if (!plans || plans.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Plans</h2>
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
                  Default
                </span>
              )}
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-md p-2 border border-gray-100">
                <p className="text-xs text-gray-500">Down</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {plan.downpayment_percentage}%
                </p>
              </div>
              <div className="bg-white rounded-md p-2 border border-gray-100">
                <p className="text-xs text-gray-500">Install.</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {plan.installment_years} yrs
                </p>
              </div>
              <div className="bg-white rounded-md p-2 border border-gray-100">
                <p className="text-xs text-gray-500">Deliver</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {plan.delivery_in_years} yrs
                </p>
              </div>
            </div>

            {/* Secondary info */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
              {plan.cache_discount > 0 && (
                <span>Cash discount: {plan.cache_discount}%</span>
              )}
              {plan.maintenance_fee > 0 && (
                <span>Maintenance: {plan.maintenance_fee}%</span>
              )}
              {plan.installment_increasing_percentage > 0 && (
                <span>Escalation: {plan.installment_increasing_percentage}%</span>
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
