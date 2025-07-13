import Footer from "@/components/web/common/footer";
import Header from "@/components/web/common/Header";
import HeroSection from "@/components/web/section/HomeSection/HeroSection";
import DashbordImage from "./web/_components/DashbordImage";
import DataInsights from "./web/_components/DataInsigts";
import SalesManagerSection from "./web/_components/SmartAutmtation";

import HomePageSchema from "@/components/schema/HomePageSchema";
import { cookies } from "next/headers";
import OurResult from "./web/_components/OurResult";

export const metadata = {
  title: "LENAAI | AI-Powered Real Estate CRM & WhatsApp Automation",
  description:
    "Transform your real estate business with LENAAI's intelligent CRM. Features AI sales agents, WhatsApp automation, and advanced client management tools.",
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
