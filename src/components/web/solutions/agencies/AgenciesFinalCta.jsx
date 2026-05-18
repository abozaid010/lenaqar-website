"use client";

import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import {
  APP_STORE_ANDROID,
  APP_STORE_IOS,
  getWhatsAppUrl,
} from "@/lib/solutions/links";
import { Apple, Download, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function AgenciesFinalCta() {
  const { translate } = useI18n();

  return (
    <section className="py-16 md:py-20 bg-primary text-white">
      <div className="container">
        <FadeIn className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold">
            {translate("solutions.agencies.simple.finalCta.title")}
          </h2>
          <p className="mt-4 text-blue-100/90">
            {translate("solutions.agencies.simple.finalCta.subtitle")}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/download"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-primary font-semibold px-8 py-4 text-sm shadow-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="h-5 w-5" aria-hidden />
              {translate("solutions.agencies.simple.finalCta.downloadApp")}
            </Link>
            <a
              href={getWhatsAppUrl(
                translate("solutions.agencies.partnerMessage")
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold px-8 py-4 text-sm shadow-lg transition-colors"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              {translate("solutions.agencies.simple.finalCta.contactUs")}
            </a>
          </div>
          <div className="mt-8 flex justify-center gap-6 text-sm text-blue-200">
            <a
              href={APP_STORE_IOS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-white transition-colors"
            >
              <Apple className="h-4 w-4" aria-hidden />
              App Store
            </a>
            <a
              href={APP_STORE_ANDROID}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" aria-hidden />
              Google Play
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
