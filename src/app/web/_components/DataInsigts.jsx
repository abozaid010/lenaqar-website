import Image from "next/image";
import { ArrowRight, X } from "lucide-react";
import CalendarModal from "@/components/ui/calendar-modal";

const DataInsights = () => {
  return (
    <section className=" max-w-[85%] w-full mx-auto  ">
      <div className="bg-white overflow-hidden mt-4">
        <div className="flex flex-col items-center lg:flex-row space-x-10">
          {/* Content Side (Right) */}

          {/* Image Side (Left) */}
          <div className="lg:w-1/2 relative min-h-[300px]">
            <Image
              src={"/images/Image 85.png"} // Replace with your actual image path
              alt="Hani - The Overwhelmed Sales Manager"
              fill
              className="object-cover rounded-2xl"
            />
          </div>
          <div className="py-4 lg:py-12 lg:w-1/2 flex flex-col justify-center ">
            <h2 className="text-3xl md:text-2xl font-bold text-gray-800 mb-6">
              Meet Sara – The Marketing Manager
            </h2>

            <ul className="space-y-6 mb-8">
              <li className="flex items-start">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  "I spend thousands on ads, but most leads aren't even serious
                  buyers!"
                </p>
              </li>

              <li className="flex items-start">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  "Sales blames me for 'low-quality leads,' but I don't have the
                  right tools to qualify them."
                </p>
              </li>

              <li className="flex items-start">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  "By the time our team reaches out, leads have already chosen a
                  competitor."
                </p>
              </li>
            </ul>
          </div>
        </div>
        <div className="  py-8 px-6 rounded-b-2xl text-center">
          <p className="text-xl font-medium text-gray-800 mb-2 font-montserrat">
            Sounds familiar?
          </p>
          <p className="text-lg text-gray-700 mb-2">
            Lena is here to solve these challenges.
          </p>
          <CalendarModal  />
        </div>
      </div>
    </section>
  );
};

export default DataInsights;
