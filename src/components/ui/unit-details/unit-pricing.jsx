"use client";

import { useI18n } from "@/context/translate-api";
import { formatCurrency } from "@/utils/formatters";
import { useState } from "react";

export default function UnitPricing({ unit }) {
  const [activeDuration, setActiveDuration] = useState("monthly");
  const { t } = useI18n();
  const isSale = unit.purpose === "sell";

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

  const getDurationText = (duration) => {
    // First try to get the translation from unitDetails.unit_pricing.per_duration
    const perDuration = getTranslation(
      `unitDetails.unit_pricing.per_duration.${duration}`,
      ""
    );
    if (perDuration) return perDuration;

    // Fallback to rental translations if unitDetails.unit_pricing is not available
    const rentalDuration = getTranslation(`rental.${duration}`, "");
    if (rentalDuration) {
      // Add "per" prefix based on duration
      switch (duration) {
        case "daily":
          return getTranslation("rental.per_night", " ");
        case "weekly":
          return getTranslation("rental.per_week", "");
        case "monthly":
          return getTranslation("rental.per_month", "");
        default:
          return "";
      }
    }

    // Final fallback
    return "";
  };

  const getDurationLabel = (duration) => {
    return getTranslation(`rental.${duration}`, duration);
  };

  return (
    <div className="mt-2">
      {isSale ? (
        <div>
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(unit.totalPrice)}{" "}
            <span className="text-sm font-normal">
              {getTranslation("unitDetails.unit_pricing.currency", "EGP")}
            </span>
          </div>

          {unit.downPayment > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {getTranslation(
                "unitDetails.unit_pricing.down_payment",
                "Down Payment"
              )}
              : {formatCurrency(unit.downPayment)}{" "}
              {getTranslation("unitDetails.unit_pricing.currency", "EGP")}
            </div>
          )}

          {unit.paymentPlans.length > 0 && (
            <div className="mt-4 max-h-77 overflow-y-auto space-y-2">
              {unit.paymentPlans.map((p, index) => (
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
                    {/* Total Price */}
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

                    {/* Down Payment */}
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

                    {/* Down Payment */}
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

                    {/* Maintenance */}
                    {p.maintenance ? (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-semibold">
                          {t.saleDetails.maintenance}:
                        </span>
                        <span className="font-bold text-blue-700">
                          {formatCurrency(p.maintenance)} EGP
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
        <div className="max-w-sm">
          {/* Rental Duration Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            {Object.keys(unit.rentDurationType).map((duration) => (
              <button
                key={duration}
                className={`py-2 px-4 text-sm font-medium ${
                  activeDuration === duration
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-700"
                } disabled:opacity-50`}
                onClick={() => setActiveDuration(duration)}
                disabled={unit.rentDurationType[duration]?.price <= 0}
              >
                {getDurationLabel(duration)}
              </button>
            ))}
          </div>

          {/* Price Display */}
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(unit.rentDurationType[activeDuration]?.price || 0)}{" "}
            <span className="text-sm font-normal">
              {unit.rentDurationType[activeDuration]?.currency ||
                getTranslation("unitDetails.common.na", "N/A")}
            </span>
          </div>

          <div className="mt-1 text-sm text-gray-600">
            {getDurationText(activeDuration)}
          </div>

          {/* Additional Fees */}
          <div className="mt-3 space-y-1">
            {unit.rentDurationType[activeDuration]?.securityDeposit > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {getTranslation(
                    "unitDetails.unit_pricing.security_deposit",
                    " التأمين"
                  )}
                </span>
                <span className="font-medium">
                  {formatCurrency(
                    unit.rentDurationType[activeDuration]?.securityDeposit
                  )}{" "}
                  {unit.rentDurationType[activeDuration]?.currency}
                </span>
              </div>
            )}

            {unit.rentDurationType[activeDuration]?.cleaningFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {getTranslation(
                    "unitDetails.unit_pricing.cleaning_fee",
                    "رسوم تنظيف"
                  )}
                </span>
                <span className="font-medium">
                  {formatCurrency(
                    unit.rentDurationType[activeDuration]?.cleaningFee
                  )}{" "}
                  {unit.rentDurationType[activeDuration]?.currency}
                </span>
              </div>
            )}

            {unit.rentDurationType[activeDuration]?.serviceFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {getTranslation(
                    "unitDetails.unit_pricing.service_fee",
                    "رسوم خدمة"
                  )}
                </span>
                <span className="font-medium">
                  {formatCurrency(
                    unit.rentDurationType[activeDuration]?.serviceFee
                  )}{" "}
                  {unit.rentDurationType[activeDuration]?.currency}
                </span>
              </div>
            )}
          </div>

          {/* Availability */}
          {unit.isAvailable && (
            <div className="mt-3 p-2 bg-green-50 rounded-md">
              <div className="text-sm font-medium text-green-900">
                {getTranslation(
                  "unitDetails.unit_pricing.available_now",
                  "متاح الآن"
                )}
              </div>
              <div className="mt-1 text-sm text-green-700">
                {getTranslation("unitDetails.unit_pricing.from", "من")}{" "}
                {formatDate(unit.availabilityDate)}
              </div>
            </div>
          )}

          {!unit.isAvailable && (
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

// Helper functions
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
