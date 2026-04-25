"use client";

import { useI18n } from "@/context/translate-api";
import { formatCurrency } from "@/utils/formatters";
import { useState } from "react";

import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { useLocaleConstants } from '@/utils/localeConstants';

export default function UnitPricing({ unit, missingRequiredFields = [] }) {
  const { formatDate } = useLocaleConstants();
  const [activeDuration, setActiveDuration] = useState("monthly");
  const { t } = useI18n();
  const u = unit || {};
  const missing = missingRequiredFields || [];
  const isMissing = (field) => missing.includes(field);
  const isSale = u.purpose === "sell";
  const rentDurationType = u.rentDurationType || {};
  const durationKeys = Object.keys(rentDurationType);
  const activeRent = durationKeys.length > 0 && rentDurationType[activeDuration] != null
    ? rentDurationType[activeDuration]
    : rentDurationType.daily ?? rentDurationType.weekly ?? rentDurationType.monthly ?? {};

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
            isMissing("rentDurationType") ? MISSING_FIELD_CLASS + " p-3" : ""
          }`}
        >
          {/* Rental Duration Tabs */}
          {durationKeys.length > 0 && (
          <div className="flex border-b border-gray-200 mb-4">
            {durationKeys.map((duration) => (
              <button
                key={duration}
                className={`py-2 px-4 text-sm font-medium ${
                  activeDuration === duration
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-700"
                } disabled:opacity-50`}
                onClick={() => setActiveDuration(duration)}
                disabled={(rentDurationType[duration]?.price ?? 0) <= 0}
              >
                {getDurationLabel(duration)}
              </button>
            ))}
          </div>
          )}

          {/* Price Display */}
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(activeRent?.price ?? 0)}{" "}
            <span className="text-sm font-normal">
              {activeRent?.currency ||
                getTranslation("unitDetails.common.na", "N/A")}
            </span>
          </div>

          <div className="mt-1 text-sm text-gray-600">
            {getDurationText(activeDuration)}
          </div>

          {/* Additional Fees */}
          <div className="mt-3 space-y-1">
            {(activeRent?.securityDeposit ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {getTranslation(
                    "unitDetails.unit_pricing.security_deposit",
                    " التأمين"
                  )}
                </span>
                <span className="font-medium">
                  {formatCurrency(activeRent?.securityDeposit)}{" "}
                  {activeRent?.currency}
                </span>
              </div>
            )}

            {(activeRent?.cleaningFee ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {getTranslation(
                    "unitDetails.unit_pricing.cleaning_fee",
                    "رسوم تنظيف"
                  )}
                </span>
                <span className="font-medium">
                  {formatCurrency(activeRent?.cleaningFee)}{" "}
                  {activeRent?.currency}
                </span>
              </div>
            )}

            {(activeRent?.serviceFee ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {getTranslation(
                    "unitDetails.unit_pricing.service_fee",
                    "رسوم خدمة"
                  )}
                </span>
                <span className="font-medium">
                  {formatCurrency(activeRent?.serviceFee)}{" "}
                  {activeRent?.currency}
                </span>
              </div>
            )}
          </div>

          {/* Availability */}
          {u.isAvailable && (
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

          {!u.isAvailable && (
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

