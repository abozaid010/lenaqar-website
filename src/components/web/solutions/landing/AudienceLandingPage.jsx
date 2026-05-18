"use client";

import AudienceClients from "@/components/web/solutions/landing/AudienceClients";
import AudienceFinalCta from "@/components/web/solutions/landing/AudienceFinalCta";
import AudienceVideo from "@/components/web/solutions/landing/AudienceVideo";
import LandingHeroSection from "@/components/web/solutions/landing/LandingHeroSection";
import LandingPartnershipSection from "@/components/web/solutions/landing/LandingPartnershipSection";
import LandingProblemSection from "@/components/web/solutions/landing/LandingProblemSection";
import LandingSolutionSection from "@/components/web/solutions/landing/LandingSolutionSection";
import LandingWhyFailSection from "@/components/web/solutions/landing/LandingWhyFailSection";

export default function AudienceLandingPage({ audience }) {
  return (
    <main className="min-h-screen bg-white">
      <LandingHeroSection audience={audience} />
      <LandingProblemSection audience={audience} />
      <LandingWhyFailSection audience={audience} />
      <LandingSolutionSection audience={audience} />
      <LandingPartnershipSection audience={audience} />
      <AudienceClients audience={audience} />
      <AudienceVideo audience={audience} />
      <AudienceFinalCta audience={audience} />
    </main>
  );
}
