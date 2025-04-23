import Footer from "@/components/web/common/footer";
import Header from "@/components/web/common/Header";
import DataInsights from "./web/_components/DataInsigts";
import SalesManagerSection from "./web/_components/SmartAutmtation";
import HeroSection from "@/components/web/section/HomeSection/HeroSection";
import DashbordImage from "./web/_components/DashbordImage";
import DynamicTitle from "@/components/web/common/DynamicTitle";

export const metadata = {
  title: "LENAAI",
  description: "LENAAI, your AI property consultant.",
};

export default function HomePage() {
  return (
    <>
      <DynamicTitle />
      <Header />

      {/* Hero Section with Title */}
      <HeroSection />

      <DashbordImage />

      {/* Smart Automation Section */}
      <SalesManagerSection />

      {/* Data Insights Section */}
      <DataInsights />

      <Footer />
    </>
  );
}
