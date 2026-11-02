import { SITE } from "@/config/site";
import { getDoor } from "@/lib/lenaqar/doors";
import { doorMetadata } from "@/lib/lenaqar/door-metadata";
import DoorLandingContent from "@/components/lenaqar/door-landing-content";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import DoorFaqSchema from "@/components/schema/DoorFaqSchema";
import HowToSchema from "@/components/schema/HowToSchema";

const door = getDoor("before-you-pay");

export const metadata = doorMetadata(door);

export default function BeforeYouPayPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[{ name: door.h1, url: `${SITE.url}${door.href}` }]}
      />
      <DoorFaqSchema items={door.faq} />
      {door.howTo ? (
        <HowToSchema
          name={door.howTo.name}
          description={door.howTo.description}
          steps={door.howTo.steps}
        />
      ) : null}
      <DoorLandingContent door={door} />
    </>
  );
}
