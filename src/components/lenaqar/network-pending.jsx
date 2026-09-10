"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { LENAQAR_CONTACT } from "@/config/lenaqar-contact";
import { actionButtonClass } from "@/components/ui/action-button-class";
import NetworkActivationWhatsApp from "@/components/lenaqar/network-activation-whatsapp";

export default function NetworkPending() {
  const { translate } = useI18n();

  return (
    <div className="container max-w-xl py-16 sm:py-20">
      <div className="rounded-3xl border border-primary/10 bg-primary/[0.04] p-6 sm:p-8">
        <h1 className="text-2xl font-bold leading-snug text-primary sm:text-3xl">
          {translate("lenaqar.network.pending.title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-black/70">
          {translate("lenaqar.network.pending.body").replace(
            "{phone}",
            LENAQAR_CONTACT.phoneDisplay,
          )}
        </p>
        <NetworkActivationWhatsApp />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/network"
            className={actionButtonClass({ variant: "secondary" })}
          >
            {translate("lenaqar.network.pending.back")}
          </Link>
          <Link
            href="/network/login"
            className={actionButtonClass({ variant: "secondary" })}
          >
            {translate("lenaqar.network.landing.loginCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
