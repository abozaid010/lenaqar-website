"use client"
import Image from "next/image";
import { X } from "lucide-react";
import { useI18n } from "@/context/translate-api";

const SalesManagerSection = () => {
  const { t } = useI18n();

  return (
    <section className="mt-16 max-w-[85%] w-full mx-auto md:px-4 sm:px-6 font-montserrat">
      <section className="pt-10 my-4">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {t.salesManager.title}
          </h1>
          <p className="text-xl text-gray-600">
            {t.salesManager.subtitle}
          </p>
        </div>
      </section>
      <div className="bg-white overflow-hidden mt-4">
        <div className="flex flex-col items-center lg:flex-row space-x-10 justify-between">
          {/* Content Side (Right) */}
          <div className="lg:py-12 lg:w-1/2 flex flex-col justify-center ">
            <h2 className="text-3xl md:text-2xl font-bold text-gray-800 mb-6">
              {t.salesManager.haniTitle}
            </h2>

            <ul className="space-y-6 mb-8">
              <li className="flex   items-center gap-2">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 ">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  {t.salesManager.challenges.challenge1}
                </p>
              </li>

              <li className="flex items-center gap-2">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 ">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  {t.salesManager.challenges.challenge2}
                </p>
              </li>

              <li className="flex items-center gap-2">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  {t.salesManager.challenges.challenge3}
                </p>
              </li>
            </ul>
          </div>
          {/* Image Side (Left) */}
          <div className="lg:w-1/3 relative min-h-[300px] ">
            <Image
              src={"/images/sad man.png"}
              alt={t.salesManager.imageAlt}
              fill
              className=" w-full  "
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SalesManagerSection;