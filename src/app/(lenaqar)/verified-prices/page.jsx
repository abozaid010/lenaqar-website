import { SITE } from "@/config/site";
import { getDoor } from "@/lib/lenaqar/doors";
import { doorMetadata } from "@/lib/lenaqar/door-metadata";
import DoorLandingContent from "@/components/lenaqar/door-landing-content";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import DoorFaqSchema from "@/components/schema/DoorFaqSchema";

const door = getDoor("verified-prices");

export const metadata = doorMetadata(door);

export default function VerifiedPricesPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[{ name: door.h1, url: `${SITE.url}${door.href}` }]}
      />
      <DoorFaqSchema items={door.faq} />
      <DoorLandingContent door={door} />
    </>
  );
}
