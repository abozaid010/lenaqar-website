"use client";

import AboutLenaSection from "@/components/web/solutions/sections/AboutLenaSection";
import BenefitsSection from "@/components/web/solutions/sections/BenefitsSection";
import DemoVideoSection from "@/components/web/solutions/sections/DemoVideoSection";
import ProblemGrid from "@/components/web/solutions/sections/ProblemGrid";
import ScreenshotsGallery from "@/components/web/solutions/sections/ScreenshotsGallery";
import SocialProofSection from "@/components/web/solutions/sections/SocialProofSection";
import SolutionFeatureGrid from "@/components/web/solutions/sections/SolutionFeatureGrid";
import SolutionHero from "@/components/web/solutions/sections/SolutionHero";
import SolutionsCtaSection from "@/components/web/solutions/sections/SolutionsCtaSection";
import { getAudienceConfig } from "@/content/solutions";

export default function SolutionsPageContent({ audience }) {
  const config = getAudienceConfig(audience);

  return (
    <main className="min-h-screen bg-white pb-20 lg:pb-0">
      <SolutionHero config={config} />
      <ProblemGrid config={config} />
      <SolutionFeatureGrid config={config} />
      <BenefitsSection config={config} />
      <AboutLenaSection />
      <ScreenshotsGallery />
      <DemoVideoSection />
      <SocialProofSection />
      <SolutionsCtaSection />
    </main>
  );
}
