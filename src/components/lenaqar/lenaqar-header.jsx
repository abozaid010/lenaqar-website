"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { sellerCtaHref } from "@/lib/lenaqar/whatsapp";
import { ANALYTICS } from "@/constants/analytics";
import WhatsAppCta from "./whatsapp-cta";
import BuyRequestCta from "./buy-request-cta";

export default function LenaqarHeader() {
  const { translate } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/" || pathname === "/lenaqar";

  const routeLinks = [
    { href: "/", label: translate("lenaqar.header.home") },
    { href: "/opportunities", label: translate("lenaqar.header.opportunities") },
    { href: "/sell", label: translate("lenaqar.header.sell") },
    { href: "/how-it-works", label: translate("lenaqar.header.howItWorks") },
  ];

  return (
    <header className="sticky top-0 z-40 bg-primary text-white">
      <div className="container flex items-center justify-between py-2 gap-3">
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/images/logo-5.png"
            alt={translate("lenaqar.header.logoAlt")}
            width={120}
            height={40}
            priority
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-4 text-sm">
          {routeLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-white/80 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <BuyRequestCta
            variant="secondary"
            tone="onPrimary"
            size="compact"
            label={translate("lenaqar.header.buyUnit")}
          />
        </nav>

        <div className="hidden lg:block">
          <WhatsAppCta
            href={sellerCtaHref()}
            eventName={ANALYTICS.EVENTS.SELLER_WHATSAPP_CLICKED}
            className="!py-2 !px-3 !text-xs"
          >
            {isHome
              ? translate("lenaqar.home.lenaCta")
              : translate("lenaqar.header.sell")}
          </WhatsAppCta>
        </div>

        <button
          type="button"
          className="lg:hidden p-2"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={
            open
              ? translate("lenaqar.header.closeMenu")
              : translate("lenaqar.header.openMenu")
          }
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? (
        <nav className="lg:hidden border-t border-white/20 px-4 py-3 flex flex-col gap-3">
          {routeLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-1"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <BuyRequestCta
            variant="secondary"
            tone="onPrimary"
            label={translate("lenaqar.header.buyUnit")}
            className="w-full"
          />
          <WhatsAppCta
            href={sellerCtaHref()}
            eventName={ANALYTICS.EVENTS.SELLER_WHATSAPP_CLICKED}
          >
            {translate("lenaqar.home.lenaCta")}
          </WhatsAppCta>
        </nav>
      ) : null}
    </header>
  );
}
