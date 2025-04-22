import React from "react";
import Image from "next/image";
import { ArrowRight, Check, X } from "lucide-react";

const DataInsights = () => {
  return (
    <section className="py-16 px-4 max-w-[95%] mx-auto">
      <div className="bg-white overflow-hidden rounded-2xl ">
        <div className="flex flex-col-reverse lg:flex-row items-center">
          {/* Image Side */}
          <div className="lg:w-1/2 relative min-h-[300px]">
            <Image
              src={"/images/Image 85.png"}
              alt="Data Insights - Professionals analyzing data"
              fill
              className="object-cover rounded-2xl"
            />
          </div>

          {/* Content Side */}
          <div className="p-8 lg:p-12 lg:w-1/2 flex flex-col justify-center">
            <h2 className="text-3xl md:text-3xl font-bold text-gray-800 mb-6">
              Meet Sara – The Marketing Manager
            </h2>

            <ul className="space-y-6 mb-8">
              <li className="flex items-start">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  "I spend thousands on ads, but most leads aren't even serious buyers!"
                </p>
              </li>

              <li className="flex items-start">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  "Sales blames me for 'low-quality leads,' but I don't have the right tools to qualify them."
                </p>
              </li>
              
              <li className="flex items-start">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  "By the time our team reaches out, leads have already chosen a competitor."
                </p>
              </li>
            </ul>

          
          </div>
        </div>
        
        {/* Improved bottom section with better styling */}
        <div className="  py-4 px-6 rounded-b-2xl text-center">
          <p className="text-xl font-medium text-gray-800 mb-2">Sound familiar?</p>
          <p className="text-lg text-gray-700 mb-2">Lena is here to solve these challenges.</p>
          <button className=" bg-gradient-to-r py-4 cursor-pointer from-[#3926A7] to-[#21EAF4] text-white  px-8 rounded-md inline-flex items-center transition-all duration-300 mx-auto">
            Let Lena Handle It
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default DataInsights;