import Footer from "@/components/web/common/footer";
import Header from "@/components/web/common/Header";
import HeroSection from "@/components/web/section/HomeSection/HeroSection";
import DashbordImage from "./web/_components/DashbordImage";
import DataInsights from "./web/_components/DataInsigts";
import SalesManagerSection from "./web/_components/SmartAutmtation";

import { cookies } from "next/headers";
import OurResult from "./web/_components/OurResult";

export default async function HomePage() {
  const cookieStore = await cookies();
  const client_id = cookieStore.get("lena-website-client_id")?.value;

  return (
    <>
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
