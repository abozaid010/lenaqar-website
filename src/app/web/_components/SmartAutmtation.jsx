import React from "react";
import Image from "next/image";
import { ArrowRight, X } from "lucide-react";

const SalesManagerSection = () => {
  return (
    <section className="mt-16 max-w-[85%] w-full  mx-auto md:px-4 sm:px-6 font-montserrat">
        <section className="pt-10 my-4 ">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Do you face the same challenges?
          </h1>
          <p className="text-xl text-gray-600">
          Meet Sara & Hani: Real Estate Professionals Facing Real Challenges
          </p>
        </div>
      </section>
      <div className="bg-white overflow-hidden mt-4">
        <div className="flex flex-col items-center lg:flex-row   space-x-10">
           {/* Content Side (Right) */}
           <div className="  lg:py-12 lg:w-1/2 flex flex-col justify-center">
            <h2 className="text-3xl md:text-2xl font-bold text-gray-800 mb-6">
            Meet Hani – The Overwhelmed Sales Manager
            </h2>

            <ul className="space-y-6 mb-8">
              <li className="flex items-start">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  "I waste hours talking to unqualified leads who aren't serious buyers."
                </p>
              </li>

              <li className="flex items-start">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  "I need a faster way to follow up—before my leads buy somewhere else."
                </p>
              </li>
              
              <li className="flex items-start">
                <div className="bg-red-500 text-white rounded-full p-1 mr-3 mt-1">
                  <X size={16} />
                </div>
                <p className="text-gray-700 text-lg">
                  "Our CRM is full of junk leads, making it hard to track real opportunities."
                </p>
              </li>
            </ul>

          
          </div>
          {/* Image Side (Left) */}
          <div className="lg:w-1/2 relative   min-h-[300px]">
            <Image
              src={"/images/careers2.png"}  // Replace with your actual image path
              alt="Hani - The Overwhelmed Sales Manager"
              fill
              className="object-cover rounded-2xl"
            />
          </div>

         
        </div>
      </div>
    </section>
  );
};

export default SalesManagerSection;
