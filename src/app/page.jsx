import Footer from "@/components/web/common/footer";
import Header from "@/components/web/common/Header";
import HeroSection from "@/components/web/section/HomeSection/HeroSection";
import DashbordImage from "./web/_components/DashbordImage";
import DataInsights from "./web/_components/DataInsigts";
import SalesManagerSection from "./web/_components/SmartAutmtation";

import HomePageSchema from "@/components/schema/HomePageSchema";
import { cookies } from "next/headers";
import OurResult from "./web/_components/OurResult";

import { SITE_URL } from "./metadata";

export const metadata = {
  title: "Sell Real Estate by AI - Best AI Agent Tool for Real Estate Chatbot",
  description:
    "LENAAI - ChatGPT for real estate, Realestate GPT. Best tool to sell real estate by AI agent. Real estate chatbot, lead generation, and AI-powered CRM.",
  keywords: [
    // Core AI/Agent Keywords
    "ChatGPT for real estate",
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
    "not typical CRM",
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
      "ChatGPT for real estate, Realestate GPT. Best tool to sell real estate by AI agent. Real estate chatbot, lead generation, marketing automation, and AI-powered CRM. Free listings.",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/images/logo.png`,
        width: 1200,
        height: 630,
        alt: "LENAAI Real Estate CRM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LENAAI | Sell Real Estate by AI - Best AI Agent Tool",
    description:
      "ChatGPT for real estate, Realestate GPT. Best tool to sell real estate by AI agent. Real estate chatbot, lead generation, marketing automation, and AI-powered CRM.",
    images: [`${SITE_URL}/images/logo.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const client_id = cookieStore.get("lena-website-client_id")?.value;

  return (
    <>
      <HomePageSchema />

      <Header ci={client_id} />

      {/* Hero Section with Title */}
      <HeroSection />

      <OurResult />

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
