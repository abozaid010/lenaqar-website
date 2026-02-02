import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { SITE_URL } from "../../metadata";
import CampaignsPageClient from "./_components/CampaignsPageClient";

export const metadata = {
  title: "Campaigns | LENAAI AI Sales Agent",
  description:
    "Create and manage marketing campaigns. View campaign performance and update campaign content.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/campaigns`,
  },
};

export default function CampaignsPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Campaigns",
            url: `${SITE_URL}/campaigns`,
          },
        ]}
      />
      <CampaignsPageClient />
    </>
  );
}

