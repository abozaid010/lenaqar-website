"use client";
import Image from "next/image";
import { X } from "lucide-react";
import { useI18n } from "@/context/translate-api";

const SalesManagerSection = () => {
  const { t } = useI18n();
  const isRTL = t.direction === "rtl";

  return (
    <section className="mt-6 w-[90%] mx-auto px-4">
      <div className="mx-auto text-center py-5">
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary mb-4 bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
          {t.salesManager.title}
        </h1>
        <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
          {t.salesManager.subtitle}
        </p>
      </div>

      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl overflow-hidden mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col items-center lg:flex-row justify-between gap-8">
          {/* Content Side */}
          <div className="lg:py-12 lg:w-1/2 flex flex-col justify-center">
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-8 bg-clip-text  bg-gradient-to-r from-indigo-600 to-blue-500">
              {t.salesManager.haniTitle}
            </h2>
            <ul className="space-y-4 mb-6">
              <li className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-red-500 text-white rounded-full p-1 shadow-sm">
                  <X size={16} />
                </div>
                <p className="text-gray-800 text-sm md:text-base font-medium">
                  {t.salesManager.challenges.challenge1}
                </p>
              </li>
              <li className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-red-500 text-white rounded-full p-1 shadow-sm">
                  <X size={16} />
                </div>
                <p className="text-gray-800 text-sm md:text-base font-medium">
                  {t.salesManager.challenges.challenge2}
                </p>
              </li>
              <li className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="bg-red-500 text-white rounded-full p-1 shadow-sm">
                  <X size={16} />
                </div>
                <p className="text-gray-800 text-sm md:text-base font-medium">
                  {t.salesManager.challenges.challenge3}
                </p>
              </li>
            </ul>
          </div>

          {/* Image Side - Improved */}
          <div
            className={`hidden lg:block lg:w-2/5 relative ${isRTL ? "order-first lg:order-last" : ""}`}
          >
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20"></div>
              <div className="absolute inset-2 bg-gradient-to-b from-white to-blue-50 rounded-full shadow-lg overflow-hidden">
                <div className="relative w-full h-full">
                  <Image
                    src="/images/sad man.png"
                    alt={t.salesManager.imageAlt}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 500px"
                    priority
                  />
                </div>
              </div>
              {/* Decorative circles */}
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-blue-500 rounded-full opacity-20 "></div>
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-indigo-500 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SalesManagerSection;
