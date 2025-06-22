"use client";
import { useI18n } from "@/context/translate-api";

const toArabicDigits = (str) => {
  // يحول كل رقم إنجليزي إلى رقمه العربي
  return str.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
};

const OurResult = () => {
  const { t } = useI18n();
  const isRTL = t.direction === "rtl";
  const results = [
    {
      value: t.ourResultsInNumbers.fasterLeadResponseValue,
      label: t.ourResultsInNumbers.fasterLeadResponse,
    },
    {
      value: t.ourResultsInNumbers.moreConversionValue,
      label: t.ourResultsInNumbers.moreConversion,
    },
    {
      value: t.ourResultsInNumbers.engagementValue,
      label: t.ourResultsInNumbers.engagement,
    },
    {
      value: t.ourResultsInNumbers.lessManualWorkValue,
      label: t.ourResultsInNumbers.lessManualWork,
    },
    {
      value: t.ourResultsInNumbers.increaseInSalesValue,
      label: t.ourResultsInNumbers.increaseInSales,
    },
    {
      value: t.ourResultsInNumbers.increaseInCSATValue,
      label: t.ourResultsInNumbers.increaseInCSAT,
    },
  ];
  return (
    <div className="bg-[#fafbfc] py-16" dir={t.direction}>
      <h2 className="text-center text-4xl font-bold text-gray-800 mb-12">
        {t.ourResultsInNumbers.title}
      </h2>
      <div
        className={`flex flex-col md:flex-row ${isRTL ? "md:flex-row-reverse" : ""} justify-center md:gap-x-6 gap-y-6 md:gap-y-0 w-full container`}
      >
        {results.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-sm border border-gray-200 px-8 py-6 min-w-[200px] text-center flex flex-col items-center flex-1"
          >
            <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#366cd9] to-[#3ec6e0] bg-clip-text text-transparent">
              {/* {isRTL ? toArabicDigits(item.value) : item.value} */}
              {item.value}
            </div>
            <div className="text-lg text-gray-600 font-normal leading-snug">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OurResult;
