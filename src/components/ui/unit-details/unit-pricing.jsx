"use client";

import { useI18n } from "@/hooks/useI18n";
import { formatCurrency } from "@/utils/formatters";
import { resolveMonthlyRentPrice } from "@/lib/units/unit-price";

import { useLocaleConstants } from "@/utils/localeConstants";
import { isRentVisibilityAvailable } from "@/constants/property-visibility";

const MISSING_FIELD_CLASS =
  "ring-2 ring-amber-400 ring-offset-1 rounded-md bg-amber-50/40";

export default function UnitPricing({ unit, missingRequiredFields = [] }) {
  const { formatDate } = useLocaleConstants();
  const { t, translate } = useI18n();
  const u = unit || {};
  const missing = missingRequiredFields || [];
  const isMissing = (field) => missing.includes(field);
  const isSale = u.purpose === "sell";
  const unitVisibility = u.visibility ?? u.status;
  const isAvailableForRent = isRentVisibilityAvailable(unitVisibility);
  const monthlyRent = resolveMonthlyRentPrice(u);

  // Helper function to safely get translations with fallbacks
  const getTranslation = (path, fallback) => {
    try {
      const keys = path.split(".");
      let value = t;
      for (const key of keys) {
        if (!value?.[key]) return fallback;
        value = value[key];
      }
      return value || fallback;
    } catch (error) {
      return fallback;
    }
  };

  return (
    <div className="mt-2">
      {isSale ? (
        <div
          className={
            isMissing("totalPrice") ? MISSING_FIELD_CLASS + " p-3 mt-1" : ""
          }
        >
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(u.totalPrice)}{" "}
            <span className="text-sm font-normal">
              {getTranslation("unitDetails.unit_pricing.currency", "EGP")}
            </span>
          </div>

          {(u.downPayment != null && Number(u.downPayment) > 0) && (
            <div className="mt-2 text-sm text-gray-600">
              {getTranslation(
                "unitDetails.unit_pricing.down_payment",
                "Down Payment"
              )}
              : {formatCurrency(u.downPayment)}{" "}
              {getTranslation("unitDetails.unit_pricing.currency", "EGP")}
            </div>
          )}

          {(u.paymentPlans?.length ?? 0) > 0 && (
            <div className="mt-4 max-h-77 overflow-y-auto space-y-2">
              {(u.paymentPlans || []).filter(Boolean).map((p, index) => (
                <div
                  key={index}
                  className="p-3 bg-gradient-to-r from-[#e2dbff] to-[#f0ebff] rounded-lg border border-purple-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-bold text-primary">
                      {p.years}{" "}
                      {p.years > 1
                        ? t.saleDetails.yearsLabel
                        : t.saleDetails.yearLabel}
                    </span>
                    <span className="text-xs text-gray-600">
                      {t.saleDetails.paymentPlan}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    {p.price && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-semibold">
                          {t.saleDetails.price}:
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(p.price)} EGP
                        </span>
                      </div>
                    )}

                    {p.downPayment && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-semibold">
                          {t.saleDetails.downPayment}:
                        </span>
                        <span className="font-bold text-green-700">
                          {formatCurrency(p.downPayment)} EGP
                        </span>
                      </div>
                    )}

                    {p.downPayment && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-semibold">
                          {t.saleDetails.installment}:
                        </span>
                        <span className="font-bold text-red-500">
                          {formatCurrency(p.installment_amount_yearly)} EGP
                        </span>
                      </div>
                    )}

                    {p.maintenance ? (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-semibold">
                          {t.saleDetails.maintenance}:
                        </span>
                        <span className="font-bold text-blue-700">
                          {formatCurrency(p.maintenance || 0)} EGP
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          className={`max-w-sm ${
            isMissing("monthlyRentPrice") ? MISSING_FIELD_CLASS + " p-3" : ""
          }`}
        >
          {(() => {
            const hasPrice = monthlyRent != null;
            const na = getTranslation("unitDetails.common.na", "N/A");
            const currencyLabel =
              t?.currency?.egp ||
              t?.unitDetails?.unit_pricing?.currency ||
              "EGP";
            return (
              <div className="text-3xl font-bold text-primary">
                {hasPrice ? (
                  <>
                    {formatCurrency(monthlyRent)}{" "}
                    <span className="text-sm font-normal">{currencyLabel}</span>
                  </>
                ) : (
                  na
                )}
              </div>
            );
          })()}

          <div className="mt-1 text-sm text-gray-600">
            {translate(
              "rentalDetails.monthlyRentPrice",
              getTranslation("rental.per_month", "Monthly rent")
            )}
          </div>

          {/* Availability */}
          {isAvailableForRent && (
            <div className="mt-3 p-2 bg-green-50 rounded-md">
              <div className="text-sm font-medium text-green-900">
                {getTranslation(
                  "unitDetails.unit_pricing.available_now",
                  "متاح الآن"
                )}
              </div>
              <div className="mt-1 text-sm text-green-700">
                {getTranslation("unitDetails.unit_pricing.from", "من")}{" "}
                {formatDate(u.availabilityDate)}
              </div>
            </div>
          )}

          {!isAvailableForRent && (
            <div className="mt-4 p-3 bg-red-50 rounded-md">
              <div className="text-sm font-medium text-red-900">
                {getTranslation(
                  "unitDetails.unit_pricing.currently_unavailable",
                  "Currently Unavailable"
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
