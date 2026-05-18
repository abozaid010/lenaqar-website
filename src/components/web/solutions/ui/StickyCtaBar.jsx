"use client";

import CalendarModal from "@/components/ui/calendar-modal";
import { useI18n } from "@/hooks/useI18n";
import { getWhatsAppUrl } from "@/lib/solutions/links";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function StickyCtaBar() {
  const { translate } = useI18n();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname === "/for-marketing-agencies" || !visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-slate-200/80 bg-white/90 backdrop-blur-xl px-4 py-3 safe-area-pb"
      role="region"
      aria-label="Quick actions"
    >
      <div className="container flex gap-3">
        <CalendarModal
          buttonText={translate("solutions.stickyCta.bookDemo")}
          style="flex-1 justify-center rounded-xl bg-primary text-white font-medium py-3 px-4 text-sm shadow-lg"
        />
        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white font-medium py-3 px-4 text-sm shadow-lg"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          {translate("solutions.stickyCta.whatsapp")}
        </a>
      </div>
    </div>
  );
}
