"use client";

import { lk } from "@/content/solutions/landingConfig";
import { FadeIn } from "@/components/web/solutions/ui/FadeIn";
import { useI18n } from "@/hooks/useI18n";
import { getWhatsAppUrl } from "@/lib/solutions/links";
import { Download, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function AudienceFinalCta({ audience }) {
  const { translate } = useI18n();

  return (
    <section className="py-12 md:py-16 bg-white border-t border-slate-200">
      <div className="container">
        <FadeIn className="flex flex-col sm:flex-row justify-center gap-4 max-w-lg mx-auto">
          <Link
            href="/download"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold px-6 py-3.5 text-sm hover:opacity-95 transition-opacity"
          >
            <Download className="h-5 w-5" aria-hidden />
            {translate(lk(audience, "finalCta.downloadApp"))}
          </Link>
          <a
            href={getWhatsAppUrl(translate(`solutions.${audience}.partnerMessage`))}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold px-6 py-3.5 text-sm transition-colors"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            {translate(lk(audience, "finalCta.contactUs"))}
          </a>
        </FadeIn>
      </div>
    </section>
  );
}
