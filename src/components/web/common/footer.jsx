"use client";
import ChatBot from "@/components/ui/ChatBot";
import { useI18n } from "@/context/translate-api";
import {
  Apple,
  Bot,
  Building,
  Facebook,
  Linkedin,
  MessageCircle,
  Phone,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

const Footer = () => {
  const { t } = useI18n();

  // App Store links (region-agnostic so Apple redirects to user's local store)
  const appStoreLink =
    "https://apps.apple.com/app/lenaai-dashboard/id6745050088";
  const playStoreLink =
    "https://play.google.com/store/apps/details?id=net.lenaai.LenaAIDashboardApp&pli=1";

  // Facebook link
  const facebookLink = "https://www.facebook.com/profile.php?id=61587419182034";

  return (
    <footer className="bg-primary text-white py-10 relative">
      {/* ChatBot Component */}
      <ChatBot />

      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold border-b border-white pb-2">
              {t.footer.companyInfo.title}
            </h3>
            <div className="flex items-start space-x-3">
              <Building className="mt-1 flex-shrink-0" />
              <p>{t.footer.companyInfo.address}</p>
            </div>

            {/* Privacy Policy Link */}
            <div className="mt-2">
              <Link
                href="/privacy"
                className="flex items-center space-x-3 hover:text-blue-200 transition-colors group"
              >
                <div className="p-2 bg-white/10 rounded-full transition-colors">
                  <MessageCircle size={20} />
                </div>
                <span>{t.footer.connect.privacyPolicy}</span>
              </Link>
            </div>
            {/* iOS App Store Link */}
            <Link
              href={appStoreLink}
              className="flex items-center space-x-3 hover:text-blue-200 transition-colors group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="p-2 bg-white/10 rounded-full transition-colors">
                <Apple size={20} />
              </div>
              <span>{t.footer.connect.dowenloadios} </span>
            </Link>

            {/* Google Play Store Link */}
            <Link
              href={playStoreLink}
              className="flex items-center space-x-3 hover:text-blue-200 transition-colors group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="p-2 bg-white/10 rounded-full transition-colors">
                <ShoppingBag size={20} />
              </div>

              <span>{t.footer.connect.dowenloadAndroid} </span>
            </Link>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold border-b border-white pb-2">
              {t.footer.contact.title}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center p-4 gap-2 border-gray-200">
                <div className="p-3 border rounded-full mr-4">
                  <Phone className="text-white" size={24} />
                </div>
                <div className="flex flex-col">
                  <div className="space-y-1">
                    {/* <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {t.footer.contact.sales} :
                      </span>
                      <a
                        href="tel:01016080323"
                        className="ml-2 text-white hover:text-blue-500 hover:underline transition-colors"
                      >
                        01016080323
                      </a>
                    </div> */}
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {t.footer.contact.support} :
                      </span>
                      <a
                        href="tel:01016080323"
                        className="ml-2 text-white hover:text-blue-500 hover:underline transition-colors"
                      >
                        01016080323
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold border-b border-white pb-2">
              {t.footer.connect.title}
            </h3>

            {/* LinkedIn Link */}
            <Link
              href="https://www.linkedin.com/company/lenaai-net/"
              className="flex items-center space-x-3 hover:text-blue-200 transition-colors group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="p-2 bg-white/10 rounded-full transition-colors">
                <Linkedin size={20} />
              </div>
              <span>{t.footer.connect.linkedin}</span>
            </Link>

            {/* Facebook Link */}
            <Link
              href={facebookLink}
              className="flex items-center space-x-3 hover:text-blue-200 transition-colors group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="p-2 bg-white/10 rounded-full transition-colors">
                <Facebook size={20} />
              </div>
              <span>{t.footer.connect.Facebook}</span>
            </Link>

            {/* Chatbot Link in footer */}
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('[aria-label="Toggle Chat"]').click();
              }}
              className="flex items-center space-x-3 hover:text-blue-200 transition-colors group cursor-pointer"
            >
              <div className="p-2 bg-white/10 rounded-full transition-colors">
                <Bot size={20} />
              </div>
              <span>{t.footer.connect.chat}</span>
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/30 text-center">
          <p>
            {t.footer.copyright} {new Date().getFullYear()}{" "}
            {t.footer.companyName}. {t.footer.rightsReserved},{" "}
            {t.footer.version} 0.0.001
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
