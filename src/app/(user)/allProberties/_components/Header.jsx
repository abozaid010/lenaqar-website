"use client";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header
      className="flex items-center justify-between px-4 py-3 h-16 fixed top-0 left-0 w-full z-10 shadow-md"
      style={{ backgroundColor: "#030250" }}
    >
      <Link
        href={"/"}
        className="flex items-center text-white hover:text-gray-300 transition-colors"
      >
        <ArrowLeft size={24} className="mr-1" />
        <span className="text-sm font-medium">Back</span>
      </Link>

      <Link href={"/"} className="flex items-center  ">
        <Image alt="logo" src={"/images/logo-5.png"} width={60} height={60} />
      </Link>
    </header>
  );
}
