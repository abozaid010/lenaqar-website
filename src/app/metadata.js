const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lenaai.net";

export const defaultMetadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LENAAI | Sell Real Estate by AI - Best AI Agent Tool for Real Estate Chatbot",
    template: "%s | LENAAI",
  },
  description:
    "LENAAI - ChatGPT for real estate, Realestate GPT. Best tool to sell real estate by AI agent. Real estate chatbot, lead generation, marketing automation, and AI-powered CRM. Free listings.",
  keywords: [
    // Primary Value: Real Estate Chatbot (Sell by AI)
    "sell real estate by AI",
    "best tool to sell real estate by AI agent",
    "real estate chatbot",
    "AI agent real estate",
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
    "realestate chatgpt",
    "AI-powered real estate chatbot",
    "AI real estate salesman",
    "best AI tool for real estate",
    "automated real estate sales",
    "close deals in minutes",
    "real broker AI",
    "AI property matching",
    "intelligent property recommendations",
    // Secondary Value: Lead Generation & Marketing
    "generate qualified leads",
    "qualified leads real estate",
    "lead generation real estate",
    "marketing automation real estate",
    "improve marketing campaigns",
    "lead filtration",
    "non-qualified leads",
    "increase conversion rate",
    "conversion rate to sales",
    "marketing campaign performance",
    "real estate marketing automation",
    // Tertiary Value: CRM with AI
    "AI-powered CRM",
    "CRM for properties",
    "real estate CRM",
    "CRM automation",
    "lead management CRM",
    "client scoring AI",
    "real estate AI assistant",
    "AI property agent",
    "AI Best Tool for realestate",
    "Chatbot",
    "real estate AI Agent",
    "AI real estate agent",
    "Real Estate Chatbot",
    // Fourth Value: Free Listings
    "free real estate listings",
    "property listings",
    "real estate listings",
    // Middle East Countries
    "real estate Egypt",
    "real estate UAE",
    "real estate Saudi Arabia",
    "real estate Kuwait",
    "real estate Qatar",
    "real estate Bahrain",
    "real estate Oman",
    "real estate Jordan",
    "real estate Lebanon",
    "real estate Middle East",
    "real estate GCC",
    // Arabic Keywords (Transliterated)
    "عقارات ذكاء اصطناعي",
    "مساعد عقاري ذكي",
    "روبوت عقاري",
    "ذكاء اصطناعي للعقارات",
    "منصة عقارية ذكية",
    "AI عقارات",
    "ChatGPT عقارات",
    // Location Specific
    "real estate Cairo",
    "real estate Dubai",
    "real estate Riyadh",
    "real estate Kuwait City",
    "real estate Doha",
    "real estate Abu Dhabi",
    "real estate Jeddah",
    "developers in Egypt",
    "developers in UAE",
    "developers in Saudi Arabia",
    "developers in Kuwait",
    "developers in Qatar",
    // Payment/Installment Terms
    "installments",
    "تقسيط",
    "payment plans",
    "خطط الدفع",
    "real estate installments",
    "property installments",
    // General
    "primary properties",
    "lead scoring",
    "marketing analytics",
    "property listings",
    "WhatsApp automation",
    "property management"
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "LENAAI | Sell Real Estate by AI - Best AI Agent Tool",
    description:
      "ChatGPT for real estate, Realestate GPT. Best tool to sell real estate by AI agent. Real estate chatbot, lead generation, marketing automation, and AI-powered CRM. Free listings.",
    siteName: "LENAAI",
    locale: "en_US",
    alternateLocale: ["ar_SA", "ar_AE", "ar_EG", "ar_KW", "ar_QA"],
    images: [
      {
        url: `${SITE_URL}/images/logo.png`,
        width: 1200,
        height: 630,
        alt: "LENAAI AI Agent - Best AI Tool for Real Estate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LENAAI | ChatGPT for Real Estate - AI Sales Agent That Talks & Sells",
    description:
      "ChatGPT for real estate, Realestate GPT. Best tool to sell real estate by AI agent. Real estate chatbot, lead generation, marketing automation, and AI-powered CRM.",
    images: [`${SITE_URL}/images/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en": SITE_URL,
      "ar": SITE_URL,
      "ar-SA": SITE_URL, // Saudi Arabia
      "ar-AE": SITE_URL, // UAE
      "ar-EG": SITE_URL, // Egypt
      "ar-KW": SITE_URL, // Kuwait
      "ar-QA": SITE_URL, // Qatar
      "ar-BH": SITE_URL, // Bahrain
      "ar-OM": SITE_URL, // Oman
      "ar-JO": SITE_URL, // Jordan
      "ar-LB": SITE_URL, // Lebanon
    },
  },
};

export const SITE_NAME = "LENAAI";
export { SITE_URL };

