"use client";

import { useI18n } from "@/hooks/useI18n";
import {
  APP_STORE_ANDROID,
  APP_STORE_IOS,
  FACEBOOK_URL,
  LINKEDIN_URL,
  SOLUTION_ROUTES,
  WHATSAPP_DISPLAY,
} from "@/lib/solutions/links";
import { Apple, Building, Facebook, Linkedin, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function SolutionsFooter() {
  const { translate } = useI18n();

  return (
    <footer className="bg-primary text-white py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-bold">Lena AI</h3>
            <p className="text-blue-100/80 text-sm leading-relaxed">
              {translate("solutions.footer.tagline")}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold border-b border-white/20 pb-2">
              {translate("solutions.footer.solutions")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={SOLUTION_ROUTES.brokers}
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  {translate("solutions.footer.forBrokers")}
                </Link>
              </li>
              <li>
                <Link
                  href={SOLUTION_ROUTES.developers}
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  {translate("solutions.footer.forDevelopers")}
                </Link>
              </li>
              <li>
                <Link
                  href={SOLUTION_ROUTES.agencies}
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  {translate("solutions.footer.forAgencies")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold border-b border-white/20 pb-2">
              {translate("solutions.footer.company")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/blog"
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  {translate("solutions.footer.blog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  {translate("solutions.footer.faq")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  {translate("solutions.footer.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  {translate("solutions.footer.contact")}
                </Link>
              </li>
              <li>
                <Link
                  href={APP_STORE_IOS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors"
                >
                  <Apple className="h-4 w-4" aria-hidden />
                  {translate("solutions.footer.downloadIos")}
                </Link>
              </li>
              <li>
                <Link
                  href={APP_STORE_ANDROID}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                  {translate("solutions.footer.downloadAndroid")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold border-b border-white/20 pb-2">
              {translate("solutions.footer.connect")}
            </h4>
            <div className="flex items-start gap-2 text-sm text-blue-100">
              <Building className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
              <span>{translate("footer.companyInfo.address")}</span>
            </div>
            <p className="text-sm text-blue-100">
              {translate("solutions.footer.support")}:{" "}
              <a
                href={`tel:${WHATSAPP_DISPLAY}`}
                className="hover:text-white underline-offset-2 hover:underline"
              >
                {WHATSAPP_DISPLAY}
              </a>
            </p>
            <div className="flex gap-3 pt-2">
              <Link
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={translate("solutions.footer.linkedin")}
              >
                <Linkedin className="h-5 w-5" aria-hidden />
              </Link>
              <Link
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={translate("solutions.footer.facebook")}
              >
                <Facebook className="h-5 w-5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/20 text-center text-sm text-blue-100/80">
          {translate("solutions.footer.copyright")} {new Date().getFullYear()}{" "}
          {translate("solutions.footer.companyName")}.{" "}
          {translate("solutions.footer.rightsReserved")}
        </div>
      </div>
    </footer>
  );
}
