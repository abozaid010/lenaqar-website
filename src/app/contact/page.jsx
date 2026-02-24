"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Download, Smartphone, Mail, Phone } from "lucide-react";
import toast from "react-hot-toast";

const ADD_TO_HOME_TOAST_KEY = "contact-add-to-home-shown";

export default function ContactPage() {
  const [appLink, setAppLink] = useState("#");

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setAppLink("https://apps.apple.com/app/lenaai-dashboard/id6745050088");
    } else if (/android/i.test(userAgent)) {
      setAppLink(
        "https://play.google.com/store/apps/details?id=net.lenaai.LenaAIDashboardApp"
      );
    } else {
      setAppLink("https://lenaai.net");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const isMobile =
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        (typeof window !== "undefined" && window.innerWidth < 768);
      if (isMobile && !sessionStorage.getItem(ADD_TO_HOME_TOAST_KEY)) {
        sessionStorage.setItem(ADD_TO_HOME_TOAST_KEY, "1");
        toast(
          "Tip: Tap the 'Share' icon and 'Add to Home Screen' to keep my contact 1-tap away.",
          { duration: 6000 }
        );
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-primary text-primary-foreground flex flex-col items-center justify-center p-6">
      <motion.div
        className="w-full max-w-sm flex flex-col items-center gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Lena AI Logo */}
        <div className="flex justify-center">
          <Image
            src="/images/logo-5.png"
            alt="Lena AI"
            width={120}
            height={120}
            priority
            className="object-contain"
          />
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full border border-white/20 flex-shrink-0 overflow-hidden bg-white/10">
            <Image
              src="/images/ceo_image.png"
              alt="Abozaid Ibrahim, CEO of Lena AI"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-medium tracking-tight text-white">
              Abozaid Ibrahim
            </h1>
            <p className="text-sm text-white/80 mt-1">CEO, Lena AI</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <a
            href="/api/contact.vcf"
            download="Abozaid-Ibrahim.vcf"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg border border-white/30 bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            Save Contact
          </a>
          <a
            href={appLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg border border-white/30 bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <Smartphone className="w-4 h-4" strokeWidth={1.5} />
            Download Lena AI App
          </a>
        </div>

        {/* Contact info */}
        <div className="flex flex-col items-center gap-2 pt-4 border-t border-white/20 w-full text-center">
          <a
            href="mailto:abozaid@lenaai.net"
            className="flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors"
          >
            <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
            abozaid@lenaai.net
          </a>
          <a
            href="tel:+201016080323"
            className="flex items-center gap-2 text-xs text-white/70 hover:text-white transition-colors"
          >
            <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />
            01016080323
          </a>
        </div>
      </motion.div>
    </div>
  );
}
