/**
 * Default Payment Plans
 * Common payment plans that users can quickly select from
 * These can be updated later as needed
 */

export const DEFAULT_PAYMENT_PLANS = [
  {
    id: "default_5_10",
    name: "5 downpayment, 10 years",
    description: "",
    downpayment_percentage: 0.05, // 5%
    reservation_amount_percentage: 0.0,
    installment_years: 10,
    maintenance_fee: 0.0,
    cache_discount: 0.4, // 40%
    is_default: false,
    extra_payments: null,
  },
  {
    id: "default_5_12",
    name: "5 downpayment, 12 years",
    description: "",
    downpayment_percentage: 0.05, // 5%
    reservation_amount_percentage: 0.0,
    installment_years: 12,
    maintenance_fee: 0.0,
    cache_discount: 0.4, // 40%
    is_default: false,
    extra_payments: null,
  },
  {
    id: "default_5_8",
    name: "5 downpayment, 8 years",
    description: "",
    downpayment_percentage: 0.05, // 5%
    reservation_amount_percentage: 0.0,
    installment_years: 8,
    maintenance_fee: 0.0,
    cache_discount: 0.4, // 40%
    is_default: false,
    extra_payments: null,
  },
  {
    id: "default_0_10",
    name: "0 downpayment, 10 years",
    description: "",
    downpayment_percentage: 0.0, // 0%
    reservation_amount_percentage: 0.0,
    installment_years: 10,
    maintenance_fee: 0.0,
    cache_discount: 0.4, // 40%
    is_default: false,
    extra_payments: null,
  },
];

/**
 * Get default payment plans
 * @returns {Array} Array of default payment plan objects
 */
export function getDefaultPaymentPlans() {
  return DEFAULT_PAYMENT_PLANS;
}
