"use client";

import { Phone, MessageCircle, Building2, Mail } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { SITE } from "@/config/site";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";
import { sellerCtaHref } from "@/lib/lenaqar/whatsapp";
import { ANALYTICS } from "@/constants/analytics";
import { trackMetaContact } from "@/lib/meta-pixel";

export default function LenaqarFooter() {
  const { translate } = useI18n();
  const { trackEvent } = useGoogleAnalytics();

  return (
    <footer className="bg-primary text-white py-10 mt-12">
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-medium">{translate("lenaqar.footer.phone")}</p>
              <a href={`tel:${LENAQAR_CONTACT.phoneE164}`} className="hover:text-white/80">
                {LENAQAR_CONTACT.phoneDisplay}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-medium">{translate("lenaqar.footer.whatsapp")}</p>
              <a
                href={sellerCtaHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/80 underline"
                onClick={() => {
                  trackEvent(ANALYTICS.EVENTS.SELLER_WHATSAPP_CLICKED);
                  trackMetaContact();
                }}
              >
                {LENAQAR_CONTACT.phoneDisplay}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-medium">{translate("lenaqar.footer.address")}</p>
              <p>
                {LENAQAR_CONTACT.address}, {LENAQAR_CONTACT.city}
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

        <div className="space-y-3 text-sm">
          <p>{translate("lenaqar.legal.priceSource")}</p>
          <p className="text-white/70">{translate("lenaqar.footer.attribution")}</p>
        </div>
      </div>
    </footer>
  );
}
