"use client";

import { useState } from "react";

export default function UnitPricing({ unit }) {
  const [activeDuration, setActiveDuration] = useState("monthly");
  const isSale = unit.purpose === "sell";

  return (
    <div className="mt-2">
      {isSale ? (
        <div>
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(unit.totalPrice)}{" "}
            <span className="text-sm font-normal">EGP</span>
          </div>

          {unit.downPayment > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Down Payment: {formatCurrency(unit.downPayment)} EGP
            </div>
          )}

          {unit.paymentPlans.length > 0 && (
            <div>
              {unit.paymentPlans.map((p, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 mt-2 bg-[#e2dbff] px-4 rounded-xl text-sm font-semibold text-slate-700 w-fit"
                >
                  {p.years && <span>{p.years} Years - </span>}
                  {p.price && <span>{p.price} EGP </span>}
                  {p.maintenance > 0 && (
                    <span>- {p.maintenance} Maintenance</span>
                  )}
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
                {duration.charAt(0).toUpperCase() + duration.slice(1)}
              </button>
            ))}
          </div>

          {/* Price Display */}
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(unit.rentDurationType[activeDuration]?.price || 0)}{" "}
            <span className="text-sm font-normal">
              {unit.rentDurationType[activeDuration]?.currency || "N/A"}
            </span>
          </div>

          <div className="mt-1 text-sm text-gray-600">
            {activeDuration === "daily" && "per night"}
            {activeDuration === "weekly" && "per week"}
            {activeDuration === "monthly" && "per month"}
          </div>

          {/* Additional Fees */}
          <div className="mt-3 space-y-1">
            {unit.rentDurationType[activeDuration]?.securityDeposit > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Security Deposit</span>
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
                <span className="text-gray-600">Cleaning Fee</span>
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
                <span className="text-gray-600">Service Fee</span>
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
                Available Now
              </div>
              <div className="mt-1 text-sm text-green-700">
                From {formatDate(unit.availabilityDate)}
              </div>
            </div>
          )}

          {!unit.isAvailable && (
            <div className="mt-4 p-3 bg-red-50 rounded-md">
              <div className="text-sm font-medium text-red-900">
                Currently Unavailable
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions
function formatCurrency(value) {
  if (!value) return "0";
  return Number.parseInt(value).toLocaleString();
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
