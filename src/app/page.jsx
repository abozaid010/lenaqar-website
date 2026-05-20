import Footer from "@/components/web/common/footer";
import Header from "@/components/web/common/Header";
import HeroSection from "@/components/web/section/HomeSection/HeroSection";
import DashbordImage from "./web/_components/DashbordImage";
import DataInsights from "./web/_components/DataInsigts";
import SalesManagerSection from "./web/_components/SmartAutmtation";

import HomePageSchema from "@/components/schema/HomePageSchema";
import { cookies } from "next/headers";
import OurResult from "./web/_components/OurResult";
import SeoGeoLandingSection from "@/components/web/seo/SeoGeoLandingSection";

import { SITE_URL } from "./metadata";

export const metadata = {
  title: "Sell Real Estate by AI - Best AI Agent Tool for Real Estate Chatbot",
  description:
    "Lena AI is a real-estate AI agent and AI lead generator for Egypt, UAE, and MENA—AI lead generation, AI lead filtration, AI CRM, and AI ecosystem with Arabic support. 40% more conversions, 80% less manual work.",
  keywords: [
    "AI lead generator",
    "AI lead generation",
    "AI lead filtration",
    "AI CRM",
    "AI ecosystem",
    "AI salesman",
    // Brand / Name Variations
    "LENAAI",
    "LenaAI",
    "Lena AI",
    "lenaai",
    "lena",
    "Lina AI",
    "lina ai",
    "Realstate AI Sales agent",
    // Core AI/Agent Keywords
    "ChatGPT for real estate",
    "ChatGPT for real estate Egypt",
    "chat gpt for real estate in egypt",
    "chat gpt for realestate in egypt",
    "like ChatGPT",
    "AI Sales Agent",
    "AI Agent",
    "AI Salesman",
    "real estate ChatGPT",
    "ChatGPT real estate",
    "AI chatbot real estate",
    "conversational AI real estate",
    "AI that talks to customers",
    "AI understands customer needs",
    "AI offers properties",
    "AI offers master plans",
    "AI offers payment plans",
    "AI sells units",
    "client scoring AI",
    "AI Sales Agent workspace",
    "close deals in minutes",
    "real broker AI",
    "AI property matching",
    "intelligent property recommendations",
    "realestate chatgpt",
    "best AI tool for real estate",
    "Real Estate Chatbot",
    // Middle East Focus
    "real estate Middle East",
    "real estate GCC",
    "real estate Egypt",
    "real estate UAE",
    "real estate Saudi Arabia",
    "real estate Kuwait",
    "real estate Qatar",
    "real estate Dubai",
    "real estate Riyadh",
    "real estate Cairo",
    // Arabic Terms
    "عقارات ذكاء اصطناعي",
    "مساعد عقاري ذكي",
    "روبوت عقاري",
    "تقسيط",
    "WhatsApp automation",
    "lead scoring",
    "marketing analytics",
  ],
  openGraph: {
    title: "LENAAI | Sell Real Estate by AI - Best AI Agent Tool",
    description:
      "LENAAI (LenaAI / Lina AI) is a Real Estate AI Sales Agent for Egypt—like ChatGPT for real estate: chatbot, lead generation, and marketing automation.",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/images/logo.png`,
        width: 1200,
        height: 630,
        alt: "LENAAI Real Estate AI Sales Agent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LENAAI | Sell Real Estate by AI - Best AI Agent Tool",
    description:
      "LENAAI (LenaAI / Lina AI) is a Real Estate AI Sales Agent for Egypt—like ChatGPT for real estate: chatbot, lead generation, and marketing automation.",
    images: [`${SITE_URL}/images/logo.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

import { COOKIE_KEYS } from "@/constants/cookieKeys";

export default async function HomePage() {
  const cookieStore = await cookies();
  const client_id = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value;

  return (
    <>
      <HomePageSchema />

      <Header ci={client_id} />

      {/* Hero Section with Title */}
      <HeroSection />

      <OurResult />

      <SeoGeoLandingSection />

      <div className="overflow-hidden">
        <DashbordImage />
      </div>

      {/* Smart Automation Section */}
      <SalesManagerSection />

      {/* Data Insights Section */}
      <DataInsights />

      <Footer />
    </>
  );
}
