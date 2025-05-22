"use client";

import { Check } from "lucide-react";
import dashborddesctop from "../../../../public/images/dasbordDesctop.png";
import dashbordmobile from "../../../../public/images/dashbordmobile.png";
import Image from "next/image";
import { useI18n } from "@/context/translate-api";
import CalendarModal from "@/components/ui/calendar-modal";

export default function DashboardImage() {
  const { t } = useI18n();

  const isRTL = t.direction === "rtl";
  const features = [
    {
      id: 1,
      title: t.dashboard?.features?.feature1,
    },
    {
      id: 2,
      title: t.dashboard.features.feature2,
    },
    {
      id: 3,
      title: t.dashboard.features.feature3,
    },
    {
      id: 4,
      title: t.dashboard.features.feature4,
    },
    {
      id: 5,
      title: t.dashboard.features.feature5,
    },
    {
      id: 6,
      title: t.dashboard.features.feature6,
    },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-[90%] mx-auto py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-priamry mb-4">
            {t.dashboard.title.part1}{" "}
            <span className="text-[#3926A7]">{t.dashboard.title.part2}</span>
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">
            {t.dashboard.subtitle}
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 justify-between px-4 items-center container max-w-[1280px] mx-auto">
          {/* Features List */}
          <div className="w-full lg:w-[40%] space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-primary mb-5">
              {t.dashboard.featuresTitle}
            </h2>

            {features.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center gap-4 group px-3 rounded-lg transition-all duration-300"
              >
                <div className=" w-6 h-6 shrink-0 rounded-full flex items-center justify-center bg-green-500 text-white">
                  <Check size={18} />
                </div>
                <h3 className="font-normal text-sm md:text- text-gray-800">
                  {feature.title}
                </h3>
              </div>
            ))}

            <CalendarModal
              buttonText={t.dashboard.ctaButton}
              style={
                "bg-gradient-to-r from-[#3926A7] to-[#21EAF4] hover:opacity-90 px-8   ml-4 py-3 rounded-md text-white font-medium transition-all shadow-lg mt-4"
              }
            />
          </div>

          {/* App Preview Image */}
          <div className="w-full lg:w-[55%]">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 relative">
              <div className="relative w-full">
                {/* Desktop Dashboard Image */}
                <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <Image
                    src={dashborddesctop}
                    alt={t.dashboard.images.desktopAlt}
                    className="w-full h-auto object-contain"
                    priority
                  />
                </div>

                {/* Mobile Mockup Image */}
                <div
                  className={`hidden lg:block absolute bottom-[-16%] ${isRTL ? "-left-12" : "-right-12"} w-1/3 transform`}
                >
                  <div className="relative rounded-lg border-2 border-white shadow-lg overflow-hidden">
                    <Image
                      src={dashbordmobile}
                      alt={t.dashboard.images.mobileAlt}
                      className="w-full h-auto"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
