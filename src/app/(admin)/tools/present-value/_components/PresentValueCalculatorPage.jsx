"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { calculatePresentValue } from "@/utils/api";
import { formatCurrency } from "@/utils/formatters";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";

const EMPTY_FORM = {
  totalPrice: "",
  downPayment: "",
  paid_amount: "",
  over_price: "",
  remaining_amount: "",
  installment_years: "",
  landArea: "",
};

function toOptionalNumber(value) {
  const cleaned = String(value ?? "").replace(/,/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export default function PresentValueCalculatorPage() {
  const { translate, locale, localeUtils } = useI18n();
  const clientId = LenaCookiesManager.getClientId();
  const prefix = clientId ? `/${clientId}` : "";
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const formatMoney = (value) => {
    if (value == null || !Number.isFinite(Number(value))) return "—";
    if (typeof formatCurrency === "function") {
      const formatted = formatCurrency(value);
      if (formatted) return formatted;
    }
    const n = Number(value);
    return localeUtils?.formatNumber
      ? localeUtils.formatNumber(n)
      : n.toLocaleString(locale === "ar" ? "ar-EG" : "en-US");
  };

  const formatRate = (rate) => {
    if (rate == null || !Number.isFinite(Number(rate))) return "—";
    const pct = Number(rate) <= 1 ? Number(rate) * 100 : Number(rate);
    return `${pct % 1 === 0 ? pct : pct.toFixed(1)}%`;
  };

  const handleChange = (key) => (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    setForm((prev) => ({ ...prev, [key]: raw }));
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setResult(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const totalPrice = toOptionalNumber(form.totalPrice);
    if (totalPrice == null || totalPrice <= 0) {
      setError(
        translate(
          "tools.presentValue.totalPriceRequired",
          "Total price is required"
        )
      );
      return;
    }

    const payload = {
      totalPrice,
      downPayment: toOptionalNumber(form.downPayment) ?? 0,
      paid_amount: toOptionalNumber(form.paid_amount),
      over_price: toOptionalNumber(form.over_price),
      remaining_amount: toOptionalNumber(form.remaining_amount),
      installment_years: toOptionalNumber(form.installment_years),
      landArea: toOptionalNumber(form.landArea),
    };

    // Omit null optionals so backend treats them as missing.
    Object.keys(payload).forEach((key) => {
      if (payload[key] === null) delete payload[key];
    });

    setLoading(true);
    try {
      const data = await calculatePresentValue(payload);
      setResult(data);
    } catch (err) {
      const message =
        err?.response?.data?.error_message ||
        err?.response?.data?.message ||
        err?.message ||
        translate("tools.presentValue.calculateFailed", "Could not calculate");
      setError(message);
      setResult(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-1 sm:px-0">
      <div className="mb-4">
        <Link
          href={`${prefix}/tools`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          {translate("tools.backToTools", "Back to Tools")}
        </Link>
      </div>

      <header className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-900">
          {translate(
            "tools.presentValue.title",
            "Present Value Calculator"
          )}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {translate(
            "tools.presentValue.description",
            "Compare cash and installment plans with one comparable value."
          )}
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 space-y-3"
      >
        <LenaTextField
          name="totalPrice"
          type="money"
          label={translate("tools.presentValue.totalPrice", "Total price")}
          value={form.totalPrice}
          onChange={handleChange("totalPrice")}
          required
          adornment="EGP"
          className="w-full"
        />
        <LenaTextField
          name="downPayment"
          type="money"
          label={translate("tools.presentValue.downPayment", "Down payment")}
          value={form.downPayment}
          onChange={handleChange("downPayment")}
          adornment="EGP"
          className="w-full"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LenaTextField
            name="paid_amount"
            type="money"
            label={translate("tools.presentValue.paidAmount", "Paid amount")}
            value={form.paid_amount}
            onChange={handleChange("paid_amount")}
            adornment="EGP"
            className="w-full"
          />
          <LenaTextField
            name="over_price"
            type="money"
            label={translate("tools.presentValue.overPrice", "Over price")}
            value={form.over_price}
            onChange={handleChange("over_price")}
            adornment="EGP"
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LenaTextField
            name="remaining_amount"
            type="money"
            label={translate(
              "tools.presentValue.remainingAmount",
              "Remaining amount"
            )}
            value={form.remaining_amount}
            onChange={handleChange("remaining_amount")}
            adornment="EGP"
            className="w-full"
          />
          <LenaTextField
            name="installment_years"
            type="number"
            label={translate(
              "tools.presentValue.installmentYears",
              "Installment years"
            )}
            value={form.installment_years}
            onChange={handleChange("installment_years")}
            className="w-full"
          />
        </div>
        <LenaTextField
          name="landArea"
          type="number"
          label={translate("tools.presentValue.landArea", "Area m²")}
          value={form.landArea}
          onChange={handleChange("landArea")}
          adornment="m²"
          className="w-full"
          helperText={translate(
            "tools.presentValue.landAreaHint",
            "Optional — enables price / m² in the result."
          )}
        />

        <p className="text-xs text-gray-500 space-y-1">
          <span className="block">
            {translate(
              "tools.presentValue.cashHint",
              "Leave remaining amount / years empty for a cash plan."
            )}
          </span>
          <span className="block">
            {translate(
              "tools.presentValue.paidHint",
              "If paid amount or over price is set, they are used instead of down payment."
            )}
          </span>
          <span className="block">
            {translate(
              "tools.presentValue.previewHint",
              "This is a preview only — it does not save a unit."
            )}
          </span>
        </p>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
          <button
            type="button"
            onClick={handleReset}
            className="h-10 px-4 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {translate("tools.presentValue.reset", "Reset")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-10 px-4 rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {translate("tools.presentValue.calculate", "Calculate")}
          </button>
        </div>
      </form>

      {result ? (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            {translate("tools.presentValue.results", "Results")}
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <dt className="text-xs text-gray-500">
                {translate("unitPricing.presentValue", "Present value")}
              </dt>
              <dd className="text-xl font-semibold text-primary mt-0.5">
                {formatMoney(result.presentValue)}
              </dd>
            </div>
            {result.pricePerMeter != null ? (
              <div>
                <dt className="text-xs text-gray-500">
                  {translate("unitPricing.pricePerMeter", "Price / m²")}
                </dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">
                  {formatMoney(result.pricePerMeter)}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-gray-500">
                {translate("tools.presentValue.paymentType", "Payment type")}
              </dt>
              <dd className="text-sm font-medium text-gray-900 mt-0.5">
                {result.paymentType === "installment"
                  ? translate(
                      "tools.presentValue.paymentInstallment",
                      "Installment"
                    )
                  : translate("tools.presentValue.paymentCash", "Cash")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">
                {translate(
                  "tools.presentValue.sellerCashToday",
                  "Seller cash today"
                )}
              </dt>
              <dd className="text-sm font-medium text-gray-900 mt-0.5">
                {formatMoney(result.sellerCashToday)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">
                {translate(
                  "tools.presentValue.remainingPresentValue",
                  "Remaining present value"
                )}
              </dt>
              <dd className="text-sm font-medium text-gray-900 mt-0.5">
                {formatMoney(result.remainingPresentValue)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">
                {translate("tools.presentValue.discountRate", "Discount rate")}
              </dt>
              <dd className="text-sm font-medium text-gray-900 mt-0.5">
                {formatRate(result.discountRate)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
