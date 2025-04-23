"use client";

import { useState } from "react";

export default function LenaBanner() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="max-w-3xl mx-auto  rounded-xl shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 ">
      <div className="text-center ">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">
          Sound familiar?
        </h2>

        <p className="text-lg md:text-xl text-gray-600 max-w-lg mx-auto">
          Lena is here to solve these challenges.
        </p>

        <button
          className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-300 transform ${
            isHovered
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 scale-105 shadow-md"
              : "bg-gradient-to-r from-blue-500 to-indigo-500"
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Let Lena Handle It
        </button>

        <div className="pt-4 flex justify-center space-x-4">
          <div className="h-2 w-2 rounded-full bg-blue-400"></div>
          <div className="h-2 w-2 rounded-full bg-blue-300"></div>
          <div className="h-2 w-2 rounded-full bg-blue-400"></div>
        </div>
      </div>
    </div>
  );
}
