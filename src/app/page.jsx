import Footer from "@/components/web/common/footer";
import Header from "@/components/web/common/Header";
import DataInsights from "./web/_components/DataInsigts";
import SalesManagerSection from "./web/_components/SmartAutmtation";
import HeroSection from "@/components/web/section/HomeSection/HeroSection";
import DashbordImage from "./web/_components/DashbordImage";

import { cookies } from "next/headers";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const clientName = JSON.parse(
    cookieStore.get("client_info").value
  ).client_name;

  return {
    title: clientName ? `LENAAI | ${clientName}` : "LENAAI",
    description: `LENAAI, your AI property consultant.`,
  };
}

export default function HomePage() {
  return (
    <>
      <Header />

      {/* Hero Section with Title */}
      <HeroSection />

     
      <DashbordImage/>

      {/* Smart Automation Section */}
      <SalesManagerSection />

      {/* Data Insights Section */}
      <DataInsights />

     


      <Footer />
    </>
  );
}
