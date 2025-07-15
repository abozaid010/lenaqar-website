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
      className="py-3 fixed top-0 left-0 w-full z-50 shadow-lg backdrop-blur-sm"
      style={{
        background:
          "linear-gradient(135deg, rgba(3,2,80) 0%, rgba(30,30,122) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div className="container flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="flex items-center rtl:flex-row-reverse text-white hover:text-blue-300 transition-colors group gap-2"
            aria-label="Go back"
          >
            <div className="p-1.5 rounded-full bg-white/10 group-hover:bg-white/20 transition-all">
              <ArrowLeft size={18} className="text-white" />
            </div>
            <span className="text-sm font-medium hidden sm:inline-block">
              Back
            </span>
          </button>
        </div>

        <h2 className="text-xl lg:text-2xl font-bold text-white relative text-center hidden sm:flex items-center justify-center">
          <span className="relative z-10 px-6 py-2">
            ✦ Explore our exclusive listings ✦
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-purple-100 to-blue-100 rounded-full transform -rotate-1 shadow-lg opacity-20"></div>
        </h2>

        <Link href="/" className="flex items-center relative shrink-0">
          <Image
            alt="logo"
            src="/images/logo-5.png"
            width={80}
            height={80}
            className="transform transition-transform"
          />
        </Link>
      </div>
    </header>
  );
}
