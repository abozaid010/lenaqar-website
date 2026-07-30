import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import { SITE_URL } from "../../metadata";
import MatchingPageClient from "./matching-page-client";

export const metadata = {
  title: "Matching | LENAAI AI Sales Agent",
  description:
    "Match leads with relevant property units and send WhatsApp recommendations.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/matching`,
  },
};

export default function MatchingPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Matching",
            url: `${SITE_URL}/matching`,
          },
        ]}
      />
      <MatchingPageClient />
    </>
  );
}
