"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Download, MessageCircle, Smartphone, Mail, Phone } from "lucide-react";

const WHATSAPP_NUMBER = "201016080323";
const WHATSAPP_MESSAGE = "Hi Abozaid, I got your card";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const TAGLINE = {
  ar: "باستخدام الذكاء الاصطناعى ضاعف مبيعاتك وقلل الوقت اللى بيضيع ف كل خطوه, دعنا نتواصل!",
  en: "Helping you boost your real estate business with AI-powered insights and tools. Let's connect!",
};

const APP_STORE_URLS = {
  ios: "https://apps.apple.com/eg/app/lenaai-dashboard/id6745050088",
  android: "https://play.google.com/store/apps/details?id=net.lenaai.LenaAIDashboardApp",
  desktop: "https://lenaai.net",
};

const USER_AGENT_PATTERNS = {
  ios: /iPad|iPhone|iPod/,
  android: /android/i,
};

export default function ContactPage() {
  const [platform, setPlatform] = useState("unknown");
  const [appLink, setAppLink] = useState(APP_STORE_URLS.desktop);
  const [lang, setLang] = useState("en");

  // Browser language detection
  useEffect(() => {
    const browserLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    setLang(browserLang.startsWith("ar") ? "ar" : "en");
  }, []);

  // Device detection
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor;
    if (USER_AGENT_PATTERNS.ios.test(ua)) {
      setPlatform("ios");
      setAppLink(APP_STORE_URLS.ios);
    } else if (USER_AGENT_PATTERNS.android.test(ua)) {
      setPlatform("android");
      setAppLink(APP_STORE_URLS.android);
    } else {
      setPlatform("desktop");
      setAppLink(APP_STORE_URLS.desktop);
    }
  }, []);

  // GA tracking helper
  const track = useCallback(
    (eventName, extra = {}) => {
      if (typeof gtag !== "undefined") {
        gtag("event", eventName, { platform, ...extra });
      }
    },
    [platform]
  );

  // Fire business_card_scan once platform is known
  useEffect(() => {
    if (platform !== "unknown") {
      track("business_card_scan");
    }
  }, [platform]);

  const getAppButtonLabel = () => {
    if (platform === "ios") return "Download on App Store";
    if (platform === "android") return "Get it on Google Play";
    return "Download App";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/90 text-primary-foreground flex flex-col items-center justify-start p-6 pb-28">
      <motion.div
        className="w-full max-w-sm flex flex-col items-center gap-6 pt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Profile */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="w-24 h-24 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 flex-shrink-0">
            <Image
              src="/images/ceo_image.png"
              alt="Abozaid Ibrahim, CEO of Lena AI"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Abozaid Ibrahim
            </h1>
            <p className="text-sm text-white/70 mt-0.5">CEO, Lena AI</p>
            <p className="text-xs text-white/60 mt-2 max-w-xs">
              {TAGLINE[lang]}
            </p>
          </div>
        </motion.div>

        {/* Primary Actions */}
        <motion.div
          className="w-full flex flex-col gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {/* Save Contact — primary */}
          <a
            href="/api/contact.vcf"
            download="Abozaid-Ibrahim.vcf"
            onClick={() => track("save_contact_click", { trigger: "main" })}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white text-primary font-semibold hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg"
          >
            <Download className="w-5 h-5" strokeWidth={1.5} />
            Save Contact
          </a>

          {/* WhatsApp — secondary */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_click", { trigger: "main" })}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-[#25D366]/20 border border-[#25D366]/50 text-white font-semibold hover:bg-[#25D366]/30 transition-all"
          >
            <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
            Chat on WhatsApp
          </a>

          {/* Download App — ghost */}
          <a
            href={appLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("app_download_click", { trigger: "main" })}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl border border-white/30 bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
          >
            <Smartphone className="w-5 h-5" strokeWidth={1.5} />
            {getAppButtonLabel()}
          </a>
        </motion.div>

        {/* Divider + Contact info */}
        <motion.div
          className="w-full flex flex-col gap-3 pt-4 border-t border-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <a
            href="tel:+201016080323"
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Phone className="w-4 h-4 text-white/50 flex-shrink-0" strokeWidth={1.5} />
            <span className="text-sm text-white/80">+20 101 608 0323</span>
          </a>
          <a
            href="mailto:abozaid@lenaai.net"
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Mail className="w-4 h-4 text-white/50 flex-shrink-0" strokeWidth={1.5} />
            <span className="text-sm text-white/80">abozaid@lenaai.net</span>
          </a>
        </motion.div>

        {/* Logo footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          <Image
            src="/images/logo-5.png"
            alt="Lena AI"
            width={80}
            height={80}
            className="object-contain opacity-70"
          />
        </motion.div>
      </motion.div>

      {/* Sticky bottom bar — mobile only */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-4 py-3 bg-primary/95 backdrop-blur-md border-t border-white/10"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <a
          href="/api/contact.vcf"
          download="Abozaid-Ibrahim.vcf"
          onClick={() => track("save_contact_click", { trigger: "sticky" })}
          className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors min-w-[60px]"
        >
          <Download className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Save</span>
        </a>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("whatsapp_click", { trigger: "sticky" })}
          className="flex flex-col items-center gap-1 text-[#25D366] hover:text-[#25D366]/80 transition-colors min-w-[60px]"
        >
          <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">WhatsApp</span>
        </a>

        <a
          href={appLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("app_download_click", { trigger: "sticky" })}
          className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors min-w-[60px]"
        >
          <Smartphone className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">App</span>
        </a>
      </div>
    </div>
  );
}
