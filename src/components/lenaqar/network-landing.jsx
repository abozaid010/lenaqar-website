"use client";

import Link from "next/link";
import {
  Building2,
  Eye,
  EyeOff,
  Handshake,
  Search,
  Shield,
  Upload,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { actionButtonClass } from "@/components/ui/action-button-class";
import ActionButtonArrow from "@/components/ui/action-button-arrow";

const VISIBLE_KEYS = [
  "details",
  "location",
  "price",
  "area",
  "bedrooms",
  "finishing",
  "delivery",
  "other",
];

const HIDDEN_KEYS = ["ownerName", "ownerPhone", "address", "seller"];

export default function NetworkLanding() {
  const { translate } = useI18n();

  return (
    <div className="pb-24 lg:pb-16">
      <section className="relative overflow-hidden border-b border-primary/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_100%_-10%,rgba(3,2,80,0.16),transparent_55%),radial-gradient(900px_420px_at_0%_100%,rgba(37,211,102,0.12),transparent_50%),linear-gradient(180deg,#f7f6f2_0%,#ffffff_72%)]"
        />
        <div className="container relative pt-14 pb-12 sm:pt-20 sm:pb-16">
          <p className="text-xs font-semibold tracking-wide text-primary sm:text-sm">
            {translate("lenaqar.network.landing.eyebrow")}
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold leading-[1.15] text-primary sm:text-5xl">
            {translate("lenaqar.network.landing.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-black/75 sm:text-xl">
            {translate("lenaqar.network.landing.sub")}
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-black/65">
            {translate("lenaqar.network.landing.idea")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/network/signup"
              className={actionButtonClass({ variant: "primary", size: "large" })}
            >
              {translate("lenaqar.header.joinNetwork")}
              <ActionButtonArrow size="large" />
            </Link>
            <Link
              href="/network/login"
              className={actionButtonClass({ variant: "secondary", size: "large" })}
            >
              {translate("lenaqar.network.landing.loginCta")}
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-primary sm:text-3xl">
          {translate("lenaqar.network.sides.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-base text-black/70">
          {translate("lenaqar.network.sides.sub")}
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-primary/10 bg-white p-6 shadow-[0_10px_40px_-24px_rgba(3,2,80,0.45)]">
            <Search className="text-primary" size={28} aria-hidden />
            <h3 className="mt-4 text-xl font-bold text-primary">
              {translate("lenaqar.network.sides.buyerTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-black/70">
              {translate("lenaqar.network.sides.buyerBody")}
            </p>
          </article>
          <article className="rounded-2xl border border-primary/10 bg-white p-6 shadow-[0_10px_40px_-24px_rgba(3,2,80,0.45)]">
            <Building2 className="text-primary" size={28} aria-hidden />
            <h3 className="mt-4 text-xl font-bold text-primary">
              {translate("lenaqar.network.sides.propertyTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-black/70">
              {translate("lenaqar.network.sides.propertyBody")}
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-primary/10 bg-[#f7f6f2]">
        <div className="container py-12 sm:py-16">
          <div className="flex items-start gap-3">
            <Shield className="mt-1 shrink-0 text-primary" size={28} aria-hidden />
            <div>
              <h2 className="text-2xl font-bold text-primary sm:text-3xl">
                {translate("lenaqar.network.privacy.title")}
              </h2>
              <p className="mt-2 max-w-2xl text-base text-black/70">
                {translate("lenaqar.network.privacy.sub")}
              </p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-white p-6">
              <div className="flex items-center gap-2 text-emerald-800">
                <Eye size={20} aria-hidden />
                <h3 className="font-bold">
                  {translate("lenaqar.network.privacy.visibleTitle")}
                </h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-black/75">
                {VISIBLE_KEYS.map((key) => (
                  <li key={key}>
                    {translate(`lenaqar.network.privacy.visible.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-red-200 bg-white p-6">
              <div className="flex items-center gap-2 text-red-800">
                <EyeOff size={20} aria-hidden />
                <h3 className="font-bold">
                  {translate("lenaqar.network.privacy.hiddenTitle")}
                </h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-black/75">
                {HIDDEN_KEYS.map((key) => (
                  <li key={key}>
                    {translate(`lenaqar.network.privacy.hidden.${key}`)}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm font-medium leading-relaxed text-primary">
                {translate("lenaqar.network.privacy.brokerContact")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-primary sm:text-3xl">
          {translate("lenaqar.network.how.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-base text-black/70">
          {translate("lenaqar.network.how.sub")}
        </p>
        <ol className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { num: 1, icon: Handshake },
            { num: 2, icon: Upload },
            { num: 3, icon: Search },
          ].map(({ num, icon: Icon }) => (
            <li
              key={num}
              className="rounded-2xl border border-primary/10 bg-white p-5"
            >
              <p className="text-xs font-semibold tabular-nums text-primary/50">
                {String(num).padStart(2, "0")}
              </p>
              <Icon className="mt-3 text-primary" size={24} aria-hidden />
              <h3 className="mt-3 font-bold text-primary">
                {translate(`lenaqar.network.how.step${num}Title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-black/70">
                {translate(`lenaqar.network.how.step${num}Body`)}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-black/60">
          {translate("lenaqar.network.how.crm")}
        </p>
        <div className="mt-8">
          <Link
            href="/network/signup"
            className={actionButtonClass({ variant: "primary" })}
          >
            {translate("lenaqar.network.how.cta")}
            <ActionButtonArrow />
          </Link>
        </div>
      </section>
    </div>
  );
}
