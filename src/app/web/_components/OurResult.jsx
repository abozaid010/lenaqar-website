"use client";
import { useI18n } from "@/context/translate-api";

const OurResult = () => {
  const { t } = useI18n();
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
      <div className="flex justify-center gap-2 w-full container flex-wrap">
        {results.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-sm border border-gray-200 px-2 py-5 min-w-[160px] text-center flex flex-col items-center gap-2 flex-1"
          >
            <div className="text-2xl font-bold bg-gradient-to-r from-[#366cd9] to-[#3ec6e0] bg-clip-text text-transparent">
              {item.value}
            </div>
            <div className="text-base text-gray-600 font-normal leading-snug">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OurResult;
