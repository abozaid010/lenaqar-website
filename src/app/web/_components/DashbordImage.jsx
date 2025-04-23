"use client"
import { Check } from "lucide-react";
import dashborddesctop from "../../../../public/images/dasbordDesctop.png";
import dashbordmobile from "../../../../public/images/dashbordmobile.png";
import Image from "next/image";

import CalendarModal from "@/components/ui/calendar-modal";

export default function DashboardImage() {
  const features = [
    {
      id: 1,
      title: "Manage leads on the go with a user-friendly mobile app",
    },
    {
      id: 2,
      title: "Instantly qualify & contact leads from anywhere.",
    },
    {
      id: 3,
      title:
        "AI-Powered Data Insights – Focus on the right leads and close deals faster.",
    },
    {
      id: 4,
      title:
        "Smart CRM – Track interactions, insights, and lead progress in one place.",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen font-sans">
      <div className="max-w-[85%] w-full mx-auto py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Lena is with you{" "}
            <span className="text-[#3926A7]">all the time</span>
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">
            Available on Web & Mobile – Access anytime, anywhere.
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          {/* Features List */}
          <div className="w-full lg:w-1/2 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              With Lena's seamless Web and Mobile integration, you can:
            </h2>

            {features.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center gap-4 group p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm"
              >
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-green-500 text-white transition-colors group-hover:bg-[#3926A7]">
                  <Check size={18} />
                </div>
                <h3 className="font-semibold text-gray-800">{feature.title}</h3>
              </div>
            ))}

            <CalendarModal />
          </div>

          {/* App Preview Image */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 p-4">
              <div className="relative">
                {/* Desktop Dashboard Image */}
                <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <Image
                    src={dashborddesctop}
                    alt="Lena CRM Dashboard Desktop View"
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>

                {/* Mobile Mockup Image */}
                <div className="hidden md:block absolute -bottom-6 -right-6 w-1/3 transform pb-2">
                  <div className="relative rounded-lg border-2 border-white shadow-lg overflow-hidden">
                    <Image
                      src={dashbordmobile}
                      alt="Lena CRM Mobile View"
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
