"use client"
import Image from "next/image";
import { ArrowRight, X } from "lucide-react";
import CalendarModal from "@/components/ui/calendar-modal";
import { useI18n } from "@/context/translate-api";

const DataInsights = () => {
  const { t } = useI18n();
  const isRTL = t.direction === 'rtl';

  return (
    <section className="max-w-[85%] w-full mx-auto mt-20 mb-10">
      <div className="bg-white overflow-hidden mt-4 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center lg:flex-row justify-between gap-6 p-6">
          {/* Image Side - Improved */}
          <div className={`lg:w-2/5 relative ${isRTL ? "order-last lg:order-first" : "order-first"}`}>
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
          <div className="py-4 lg:py-8 lg:w-1/2 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-primary mb-6 bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
              {t.dataInsights.saraTitle}
            </h2>

            <ul className="space-y-6 mb-8">
              <li className="flex items-start gap-3 bg-purple-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-red-500 text-white rounded-full p-1 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  {t.dataInsights.challenges.challenge1}
                </p>
              </li>

              <li className="flex items-start gap-3 bg-purple-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-red-500 text-white rounded-full p-1 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  {t.dataInsights.challenges.challenge2}
                </p>
              </li>

              <li className="flex items-start gap-3 bg-purple-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-red-500 text-white rounded-full p-1 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  {t.dataInsights.challenges.challenge3}
                </p>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="py-10 px-8 rounded-b-2xl text-center ">
          <p className="text-xl font-medium text-gray-800 mb-2 font-montserrat">
            {t.dataInsights.footer.question}
          </p>
          <p className="text-lg text-gray-700 mb-6">
            {t.dataInsights.footer.solution}
          </p>
          <CalendarModal 
            buttonText={t.dataInsights.ctaButton}
            style={"bg-gradient-to-r from-[#3926A7] to-[#21EAF4] hover:opacity-90 px-8 py-3 rounded-md text-white font-medium transition-all shadow-lg mt-4 inline-flex items-center gap-2"} 
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