"use client";

import AgenciesClients from "@/components/web/solutions/agencies/AgenciesClients";
import AgenciesFinalCta from "@/components/web/solutions/agencies/AgenciesFinalCta";
import AgenciesVideo from "@/components/web/solutions/agencies/AgenciesVideo";
import AgenciesHeroSection from "@/components/web/solutions/agencies/landing/AgenciesHeroSection";
import AgenciesPartnershipSection from "@/components/web/solutions/agencies/landing/AgenciesPartnershipSection";
import AgenciesProblemSection from "@/components/web/solutions/agencies/landing/AgenciesProblemSection";
import AgenciesSolutionSection from "@/components/web/solutions/agencies/landing/AgenciesSolutionSection";
import AgenciesWhyFailSection from "@/components/web/solutions/agencies/landing/AgenciesWhyFailSection";

export default function AgenciesPageContent() {
  return (
    <main className="min-h-screen bg-white">
      <AgenciesHeroSection />
      <AgenciesProblemSection />
      <AgenciesWhyFailSection />
      <AgenciesSolutionSection />
      <AgenciesPartnershipSection />
      <AgenciesClients />
      <AgenciesVideo />
      <AgenciesFinalCta />
    </main>
  );
}
