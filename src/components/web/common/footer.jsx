"use client";
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
            <div className="space-x-3">
              {/* <div className=" flex  gap-3">
              <Phone className="flex-shrink-0" />
              <p>{t.footer.contact.phone}</p>
              <div>
              <p>01002891933</p>
              <p>01002891933</p>
              </div>
              </div> */}
              <div className="flex items-center p-4  gap-2 border-gray-200">
                <div className="p-3 border rounded-full mr-4">
                  <Phone className="text-white" size={24} />
                </div>
                <div className="flex flex-col">
                  {/* <h3 className="text-lg font-semibold text-gray-800 mb-1">Contact Us</h3> */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{t.footer.contact.sales} :</span>
                      <a
                        href="tel:01016080323"
                        className="ml-2 text-white hover:text-blue-500 hover:underline transition-colors"
                      >
                        01016080323
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{t.footer.contact.support} :</span>
                      <a
                        href="tel:01002891933"
                        className="ml-2 text-white hover:text-blue-500 hover:underline transition-colors"
                      >
                        01002891933
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
            {t.footer.copyright} {new Date().getFullYear()}{" "}
            {t.footer.companyName}. {t.footer.rightsReserved},{t.footer.version}{" "}
            0.0.001
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
