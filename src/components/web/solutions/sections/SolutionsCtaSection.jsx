"use client";

import CalendarModal from "@/components/ui/calendar-modal";
import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import {
  APP_STORE_ANDROID,
  APP_STORE_IOS,
  getWhatsAppUrl,
} from "@/lib/solutions/links";
import { Apple, Download, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function SolutionsCtaSection() {
  const { translate } = useI18n();

  return (
    <section className="py-20 md:py-24 bg-primary relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(33,234,244,0.2), transparent)",
        }}
      />
      <div className="container relative z-10">
        <FadeIn className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {translate("solutions.shared.cta.title")}
          </h2>
          <p className="mt-4 text-lg text-blue-100/90">
            {translate("solutions.shared.cta.subtitle")}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-4">
            <CalendarModal
              buttonText={translate("solutions.shared.cta.bookDemo")}
              style="inline-flex items-center justify-center rounded-xl bg-white text-primary font-semibold px-6 py-3.5 text-sm shadow-xl hover:bg-slate-50 transition-all"
            />
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white font-semibold px-6 py-3.5 text-sm shadow-xl hover:opacity-95 transition-all"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              {translate("solutions.shared.cta.whatsapp")}
            </a>
            <Link
              href="/download"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 text-white font-semibold px-6 py-3.5 text-sm hover:bg-white/10 transition-all"
            >
              <Download className="h-5 w-5" aria-hidden />
              {translate("solutions.shared.cta.downloadApp")}
            </Link>
          </div>
          <div className="mt-8 flex justify-center gap-4 text-sm">
            <a
              href={APP_STORE_IOS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors"
            >
              <Apple className="h-4 w-4" aria-hidden />
              iOS
            </a>
            <span className="text-white/30" aria-hidden>
              |
            </span>
            <a
              href={APP_STORE_ANDROID}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" aria-hidden />
              Android
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
