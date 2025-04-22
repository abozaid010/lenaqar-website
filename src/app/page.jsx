import DataInsigts from "@/components/web/section/HomeSection/DataInsigts";
import HeroSection from "@/components/web/section/HomeSection/HeroSection";
import SmartAutmtation from "@/components/web/section/HomeSection/SmartAutmtation";
import Footer from "@/components/web/common/footer";
import Header from "@/components/web/common/Header";

export default function HomePage() {
  return (
    <>
      <Header />

      {/* Hero Section with Title */}
      <HeroSection />
      <section className="pt-10 ">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            AI Efficiency Hub
          </h1>
          <p className="text-xl text-gray-600">
            Unlock the power of AI to boost productivity and streamline
            operations effortlessly.
          </p>
        </div>
      </section>

      {/* Smart Automation Section */}
      <SmartAutmtation />

      {/* Data Insights Section */}
      <DataInsigts />

      <Footer />
    </>
  );
}
