"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <header
      className="px-4 sm:px-6 py-3 fixed top-0 left-0 w-full z-50 shadow-lg backdrop-blur-sm"
      style={{
        background:
          "linear-gradient(135deg, rgba(3,2,80) 0%, rgba(30,30,122) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div className="w-[93%] mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="flex items-center text-white hover:text-blue-300 transition-colors group"
              aria-label="Go back"
            >
              <div className="p-1.5 rounded-full mr-2 bg-white/10 group-hover:bg-white/20 transition-all">
                <ArrowLeft size={18} className="text-white" />
              </div>
              <span className="text-sm font-medium hidden sm:inline-block">
                Back
              </span>
            </button>
          </div>


          <div className="text-center">
            <h2 className="text-2xl font-bold text-white relative inline-block">
              <span className="relative z-10 px-6 py-2">✦ Explore our exclusive listings ✦</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-purple-100 to-blue-100 rounded-full transform -rotate-1 shadow-lg opacity-20"></div>
            </h2>

          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="flex items-center group">

              <div className="relative overflow-hidden transition-all">
                <Image 
                  alt="logo" 
                  src="/images/logo-5.png" 
                  width={80} 

                  height={80}
                  className="transform transition-transform"
                />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
