
import Footer from "@/components/web/common/footer";
import Header from "@/components/web/common/Header";
import DataInsights from "./web/_components/DataInsigts";
import SalesManagerSection from "./web/_components/SmartAutmtation";
import HeroSection from "@/components/web/section/HomeSection/HeroSection";
import DashbordImage from "./web/_components/DashbordImage";

export default function HomePage() {
  return (
    <>
      <Header />

      {/* Hero Section with Title */}
      <HeroSection />
     

      {/* Smart Automation Section */}
      <SalesManagerSection />

      {/* Data Insights Section */}
      <DataInsights />
      <DashbordImage/>

      <Footer />
    </>
  );
}
