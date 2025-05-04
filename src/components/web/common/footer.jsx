"use client";
import Link from "next/link";
import { Linkedin, Phone, Building, Facebook, MessageCircle, ShoppingBag, X, Bot } from "lucide-react";
import { useI18n } from "@/context/translate-api";
import { useState } from "react";

const Footer = () => {
  const { t } = useI18n();
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // App Store link - fixed without the leading 'L'
  const appStoreLink = "https://apps.apple.com/eg/app/lenaai-dashboard/id6745050088";
  
  // Facebook link
  const facebookLink = "https://www.facebook.com/profile.php?id=61575040225107";
  
  // LenaAI Chat URL
  const chatUrl = "https://chat.lenaai.net";

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <footer className="bg-primary text-white py-10 relative">
      {/* Floating Chatbot Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-[#3926A7] to-[#21EAF4] text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center z-40"
        aria-label="Toggle Chat"
      >
        <Bot size={28} />
      </button>
      
      {/* Chat Popup with iFrame - removed scrollbars */}
      <div className={`fixed bottom-4 right-4 w-80 lg:w-96 h-96 lg:h-5/6 bg-white rounded-lg shadow-2xl z-50 transition-all duration-300 transform ${isChatOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'} flex flex-col`}>
        {/* Chat Header */}
        <div className="bg-primary p-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot size={20} className="text-white" />
            <h3 className="text-lg font-medium text-white">LenaAI Chat</h3>
          </div>
          <button 
            onClick={toggleChat}
            className="text-white hover:bg-blue-700 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Chat iFrame - removed all scrolling */}
        <div className="flex-grow">
          {isChatOpen && (
            <iframe
              src={chatUrl}
              title="LenaAI Chat"
              className="w-full h-full border-0"
              allow="microphone; camera; geolocation"
              loading="lazy"
              scrolling="no"
              style={{ overflow: 'hidden' }}
            ></iframe>
          )}
        </div>
      </div>
      
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
            <div className="space-y-3">
              <div className="flex items-center p-4 gap-2 border-gray-200">
                <div className="p-3 border rounded-full mr-4">
                  <Phone className="text-white" size={24} />
                </div>
                <div className="flex flex-col">
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
              <span>Facebook</span>
            </Link>
            
            {/* Mobile App Link */}
            <Link
              href={appStoreLink}
              className="flex items-center space-x-3 hover:text-blue-200 transition-colors group"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="p-2 bg-white/10 rounded-full transition-colors">
                <ShoppingBag size={20} />
              </div>
              <span>{t.footer.connect.dowenload}</span>
            </Link>
            
            {/* Chatbot Link (additional in-footer link) */}
            <button
              onClick={toggleChat}
              className="flex items-center space-x-3 hover:text-blue-200 transition-colors group cursor-pointer"
            >
              <div className="p-2 bg-white/10 rounded-full transition-colors">
                {/* <MessageCircle size={20} /> */}
                <Bot size={20} />
              </div>
              <span> {t.footer.connect.chat}</span>
            </button>
            
            <div className="mt-2">
              <Link href="/privacy" className="text-blue-200 hover:underline">
                {t.footer.connect.privacyPolicy}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/30 text-center">
          <p>
            {t.footer.copyright} {new Date().getFullYear()}{" "}
            {t.footer.companyName}. {t.footer.rightsReserved}, {t.footer.version}{" "}
            0.0.001
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;