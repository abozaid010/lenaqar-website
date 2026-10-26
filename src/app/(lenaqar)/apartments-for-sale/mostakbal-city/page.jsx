import { SITE } from "@/config/site";
import { getBuyerLanding, filterRequirementsForLanding } from "@/lib/lenaqar/buyer-landings";
import { buyerLandingMetadata } from "@/lib/lenaqar/buyer-landing-metadata";
import { fetchPublicRequirements } from "@/lib/lenaqar/requirements.server";
import BuyerLandingContent from "@/components/lenaqar/buyer-landing-content";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export const revalidate = 300;

const landing = getBuyerLanding("apartments-for-sale/mostakbal-city");

export const metadata = buyerLandingMetadata(landing);

export default async function BuyerLandingPage() {
  const { requirements } = await fetchPublicRequirements({ limit: 48 });
  const matched = filterRequirementsForLanding(requirements, landing).slice(0, 12);

  return (
    <>
      <BreadcrumbSchema
        items={[{ name: landing.h1, url: `${SITE.url}${landing.href}` }]}
      />
      <BuyerLandingContent landing={landing} matchedRequirements={matched} />
    </>
  );
}
