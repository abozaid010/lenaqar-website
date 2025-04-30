"use client"
import Image from "next/image";
import { ArrowRight, X } from "lucide-react";
import CalendarModal from "@/components/ui/calendar-modal";
import { useI18n } from "@/context/translate-api";

const DataInsights = () => {
  const { t } = useI18n();

  return (
    <section className="max-w-[85%] w-full mx-auto">
      <div className="bg-white overflow-hidden mt-4">
        <div className="flex flex-col items-center lg:flex-row space-x-10">
          {/* Image Side (Left) */}
          <div className="lg:w-1/2 relative min-h-[300px] shadow-sm border border-gray-50">
            <Image
              src={"/images/sad  woman.png"}
              alt={t.dataInsights.imageAlt}
              fill
              className=" rounded-2xl"
            />
          </div>
          
          {/* Content Side (Right) */}
          <div className="py-4 lg:py-12 lg:w-1/2 flex flex-col justify-center">
            <h2 className="text-3xl md:text-2xl font-bold text-gray-800 mb-6">
              {t.dataInsights.saraTitle}
            </h2>

            <ul className="space-y-6 mb-8">
              <li className="flex items-center gap-2">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 ">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  {t.dataInsights.challenges.challenge1}
                </p>
              </li>

              <li className="flex items-center gap-2">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 ">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  {t.dataInsights.challenges.challenge2}
                </p>
              </li>

              <li className="flex items-center gap-2">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 ">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  {t.dataInsights.challenges.challenge3}
                </p>
              </li>
            </ul>
          </div>
        </div>
        <div className="py-8 px-6 rounded-b-2xl text-center">
          <p className="text-xl font-medium text-gray-800 mb-2 font-montserrat">
            {t.dataInsights.footer.question}
          </p>
          <p className="text-lg text-gray-700 mb-2">
            {t.dataInsights.footer.solution}
          </p>
          <CalendarModal 
            buttonText={t.dataInsights.ctaButton}
            style={"bg-gradient-to-r from-[#3926A7] to-[#21EAF4] hover:opacity-90 px-8 py-3 rounded-md text-white font-medium transition-all shadow-lg mt-4"} 
          />
        </div>
      </div>
    </section>
  );
};

export default DataInsights;