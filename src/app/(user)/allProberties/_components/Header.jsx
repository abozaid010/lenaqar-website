"use client"
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <div className="w-full mb-14 fixed z-50 ">
      {/* Main Header */}
      <header className="flex items-center justify-between    px-4 py-3" style={{ backgroundColor: "#030250" }}>
        {/* Left section - Back button */}
        <Link href={"/"} className="flex items-center text-white hover:text-gray-300 transition-colors">
          <ArrowLeft size={24} className="mr-1" />
          <span className="text-sm font-medium">Back</span>
        </Link>
        
        {/* Center section - Logo */}
        <Link href={"/"} className="flex items-center  ">
          {/* <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-xl font-bold" style={{ color: "#030250" }}>S</span>
          </div>
          <span className="ml-2 text-xl font-bold text-white">Simbel</span> */}
          <Image alt='logo' src={"/images/logo-5.png"} width={60} height={60}/>
        </Link>
      </header>
    </div>
  );
}