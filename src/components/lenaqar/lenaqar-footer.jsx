"use client";

import { Phone, MessageCircle, Building2, Mail } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { SITE } from "@/config/site";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";
import { buyerPageCtaHref, sellerCtaHref } from "@/lib/lenaqar/whatsapp";
import { DOORS } from "@/lib/lenaqar/doors";
import { ANALYTICS } from "@/constants/analytics";
import { trackMetaContactForClick } from "@/lib/meta-pixel";

const GUIDE_LINKS = [
  { href: "/guides/madinaty/prices-2026", label: "أسعار مدينتي" },
  { href: "/guides/el-shorouk/prices-2026", label: "أسعار الشروق" },
  { href: "/guides", labelKey: "lenaqar.guides.indexTitle" },
  { href: "/apartments-for-sale/new-cairo", labelKey: "lenaqar.marketplace.browse.newCairo" },
  { href: "/opportunities", labelKey: "lenaqar.header.opportunities" },
];

export default function LenaqarFooter() {
  const { translate } = useI18n();
  const { trackEvent } = useGoogleAnalytics();
  const pathname = usePathname();
  const isSellPage = pathname === "/sell" || pathname?.startsWith("/sell/");
  const contactHref = isSellPage ? sellerCtaHref() : buyerPageCtaHref(pathname);
  const contactEvent = isSellPage
    ? ANALYTICS.EVENTS.SELLER_WHATSAPP_CLICKED
    : ANALYTICS.EVENTS.BUYER_WHATSAPP_CLICKED;

  return (
    <footer className="bg-primary text-white py-10 mt-12">
      <div className="container space-y-8">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <p className="text-base font-semibold leading-relaxed">
            {translate("lenaqar.footer.goldenTitle")}
          </p>
          <ul className="space-y-2 text-sm leading-relaxed text-white/90 text-start sm:text-center">
            <li>{translate("lenaqar.footer.golden1")}</li>
            <li>{translate("lenaqar.footer.golden2")}</li>
            <li>{translate("lenaqar.footer.golden3")}</li>
          </ul>
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className="inline-block font-semibold underline underline-offset-2 hover:text-white/80"
            onClick={(event) => {
              trackEvent(contactEvent);
              trackMetaContactForClick(event);
            }}
          >
            📲 {translate("lenaqar.footer.whatsapp")} {LENAQAR_CONTACT.whatsappDisplay}
          </a>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="space-y-3">
            <p className="font-semibold">{translate("lenaqar.footer.doorsNav")}</p>
            <nav className="flex flex-col gap-2" aria-label={translate("lenaqar.footer.doorsNav")}>
              {DOORS.map((door) => (
                <Link key={door.href} href={door.href} className="hover:text-white/80">
                  {translate(`lenaqar.doors.${door.slug.replace(/-/g, "_")}.cardTitle`)}
                </Link>
              ))}
              <Link href="/how-it-works" className="hover:text-white/80">
                {translate("lenaqar.header.howItWorks")}
              </Link>
              <Link href="/sell" className="hover:text-white/80">
                {translate("lenaqar.header.sell")}
              </Link>
            </nav>
          </div>

          <div className="space-y-3">
            <p className="font-semibold">{translate("lenaqar.footer.guidesNav")}</p>
            <nav className="flex flex-col gap-2" aria-label={translate("lenaqar.footer.guidesNav")}>
              {GUIDE_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-white/80">
                  {link.labelKey ? translate(link.labelKey) : link.label}
                </Link>
              ))}
              <Link href="/calculator" className="hover:text-white/80">
                {translate("lenaqar.header.calculator")}
              </Link>
            </nav>
          </div>

          <div className="space-y-3">
            <p className="font-semibold">{translate("lenaqar.footer.trustNav")}</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-medium">{translate("lenaqar.footer.phone")}</p>
                  <a
                    href={`tel:${LENAQAR_CONTACT.phoneE164}`}
                    dir="ltr"
                    className="inline-block hover:text-white/80"
                  >
                    {LENAQAR_CONTACT.phoneDisplay}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-medium">{translate("lenaqar.footer.whatsapp")}</p>
                  <a
                    href={contactHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className="inline-block hover:text-white/80 underline"
                    onClick={(event) => {
                      trackEvent(contactEvent);
                      trackMetaContactForClick(event);
                    }}
                  >
                    {LENAQAR_CONTACT.whatsappDisplay}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-medium">{translate("lenaqar.footer.address")}</p>
                  <p>
                    {LENAQAR_CONTACT.address}، {LENAQAR_CONTACT.city}
                  </p>
                </div>
              </div>
              {SITE.showEmail ? (
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 shrink-0" size={18} />
                  <div>
                    <p className="font-medium">{translate("lenaqar.footer.email")}</p>
                    <a href={`mailto:${LENAQAR_CONTACT.email}`} className="hover:text-white/80">
                      {LENAQAR_CONTACT.email}
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-semibold">{translate("lenaqar.footer.nav")}</p>
            <nav className="flex flex-col gap-2" aria-label={translate("lenaqar.footer.nav")}>
              <Link href="/" className="hover:text-white/80">
                {translate("lenaqar.header.home")}
              </Link>
              <Link href="/#buy-request" className="hover:text-white/80">
                {translate("lenaqar.header.buyUnit")}
              </Link>
              <Link href="/network" className="hover:text-white/80">
                {translate("lenaqar.header.joinNetwork")}
              </Link>
              <Link href="/privacy" className="hover:text-white/80">
                {translate("lenaqar.footer.privacy")}
              </Link>
            </nav>
            <p className="text-white/70 pt-2">{translate("lenaqar.footer.siblingLine")}</p>
            <p className="text-white/60 text-xs">{translate("lenaqar.footer.attribution")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
