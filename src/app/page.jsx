import Footer from "@/components/web/common/footer";
import Header from "@/components/web/common/Header";
import DataInsights from "./web/_components/DataInsigts";
import SalesManagerSection from "./web/_components/SmartAutmtation";
import HeroSection from "@/components/web/section/HomeSection/HeroSection";
import DashbordImage from "./web/_components/DashbordImage";

import { cookies } from "next/headers";
import OurResult from "./web/_components/OurResult";

export default async function HomePage() {
  const cookieStore = await cookies();
  const client_id = cookieStore.get("client_id")?.value;

  return (
    <>
      <Header ci={client_id} />

      {/* Hero Section with Title */}
      <HeroSection />
      <OurResult />
      <div className=" overflow-hidden">
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
