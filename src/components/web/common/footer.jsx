"use client"
import Link from "next/link";
import { Linkedin, Phone, Building, Handshake, User } from "lucide-react";
import { useI18n } from "@/context/translate-api";

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="bg-primary text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold border-b border-white pb-2">
              {t.footer.companyInfo.title}
            </h3>
            <div className="flex items-start space-x-3">
              <Building className="mt-1 flex-shrink-0" />
              <p>{t.footer.companyInfo.address}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold border-b border-white pb-2">
              {t.footer.contact.title}
            </h3>
            <div className="flex items-center space-x-3">
              <Phone className="flex-shrink-0" />
              <p>{t.footer.contact.phone}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold border-b border-white pb-2">
              {t.footer.connect.title}
            </h3>
            <Link
              href="https://www.linkedin.com/company/lenaai-net/"
              className="flex items-center space-x-3 hover:text-blue-200 transition-colors"
            >
              <Linkedin size={24} />
              <span>{t.footer.connect.linkedin}</span>
            </Link>
            <div className="">
              <Link href="/privacy" className="text-blue-200 hover:underline">
                {t.footer.connect.privacyPolicy}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/30 text-center">
          <p>
            {t.footer.copyright} {new Date().getFullYear()} {t.footer.companyName}. {t.footer.rightsReserved}, 
            {t.footer.version} 0.0.001
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;