"use client";
import CalendarModal from "@/components/ui/calendar-modal";
import { useI18n } from "@/context/translate-api";
import { ArrowRight, X } from "lucide-react";
import Image from "next/image";

const DataInsights = () => {
  const { t } = useI18n();
  const isRTL = t.direction === "rtl";

  return (
    <section className="container my-6 md:my-8">
      <div className="bg-white overflow-hidden mt-4 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center lg:flex-row justify-between gap-6 py-6 px-4 md:px-6">
          {/* Image Side - Improved */}
          <div
            className={`hidden lg:block lg:w-2/5 relative ${isRTL ? "order-last lg:order-first" : "order-first"}`}
          >
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-purple-100 rounded-full opacity-20"></div>

              {/* Main image container */}
              <div className="absolute inset-2 bg-gradient-to-b from-white to-purple-50 rounded-full shadow-lg overflow-hidden">
                <div className="relative w-full h-full">
                  <Image
                    src="/images/sad  woman.png"
                    alt={t.dataInsights.imageAlt}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 500px"
                    priority
                  />
                </div>
              </div>

              {/* Decorative accents */}
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-indigo-500 rounded-full opacity-20"></div>
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-cyan-500 rounded-full opacity-20"></div>
            </div>
          </div>

          {/* Content Side */}
          <div className="lg:w-1/2 flex flex-col justify-center">
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-6 bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
              {t.dataInsights.saraTitle}
            </h2>

            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-red-500 text-white rounded-full p-1 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-sm md:text-base">
                  {t.dataInsights.challenges.challenge1}
                </p>
              </li>

              <li className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-red-500 text-white rounded-full p-1 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-sm md:text-base">
                  {t.dataInsights.challenges.challenge2}
                </p>
              </li>

              <li className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-red-500 text-white rounded-full p-1 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-sm md:text-base">
                  {t.dataInsights.challenges.challenge3}
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-b-2xl text-center ">
          <p className="text-xl font-medium text-gray-800 mb-1 font-montserrat">
            {t.dataInsights.footer.question}
          </p>
          <p className="text-lg text-gray-700 mb-6">
            {t.dataInsights.footer.solution}
          </p>
          <CalendarModal
            buttonText={t.dataInsights.ctaButton}
            style={
              "bg-gradient-to-r from-[#3926A7] to-[#21EAF4] hover:opacity-90 px-8 py-3 rounded-md text-white font-medium transition-all shadow-lg sinline-flex items-center gap-2"
            }
          >
            <span>{t.dataInsights.ctaButton}</span>
            <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
          </CalendarModal>
        </div>
      </div>
    </section>
  );
};

export default DataInsights;
