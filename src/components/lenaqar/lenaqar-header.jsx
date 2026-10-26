"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import BuyRequestCta from "./buy-request-cta";

export default function LenaqarHeader() {
  const { translate } = useI18n();
  const [open, setOpen] = useState(false);

  const routeLinks = [
    { href: "/", label: translate("lenaqar.header.home") },
    { href: "/opportunities", label: translate("lenaqar.header.opportunities") },
    { href: "/how-it-works", label: translate("lenaqar.header.howItWorks") },
    { href: "/guides", label: translate("lenaqar.guides.indexTitle") },
    { href: "/sell", label: translate("lenaqar.header.sell") },
    {
      href: "/network",
      label: translate("lenaqar.header.joinNetwork"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-primary text-white">
      <div className="container flex flex-wrap items-center justify-between py-2 gap-2">
        <Link
          href="/"
          dir="ltr"
          className="flex items-center gap-2 shrink-0"
        >
          <Image
            src="/images/default_logo.jpg"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl"
            priority
          />
          <span className="flex flex-col items-end gap-0.5">
            <span className="lena-wordmark-ar text-base sm:text-lg" dir="rtl">
              {translate("lenaqar.header.logoAr")}
            </span>
            <span className="lena-wordmark text-sm sm:text-base">
              {translate("lenaqar.header.logoEn")}
            </span>
          </span>
        </Link>

        <nav className="hidden lg:flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm min-w-0">
          {routeLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-white/80 transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          <BuyRequestCta
            variant="primary"
            tone="onPrimary"
            size="compact"
            label={translate("lenaqar.header.buyUnit")}
          />
        </nav>

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
            variant="primary"
            tone="onPrimary"
            label={translate("lenaqar.header.buyUnit")}
            className="w-full"
          />
        </nav>
      ) : null}
    </header>
  );
}
