import SolutionsPageSchema from "@/components/schema/SolutionsPageSchema";
import SolutionsPageContent from "@/components/web/solutions/SolutionsPageContent";
import { SITE_URL } from "@/app/metadata";

const PATH = "/for-brokers";

export const metadata = {
  title: "For Brokers | Real Estate Operating System",
  description:
    "Run your entire brokerage from one intelligent system. Manage leads, teams, WhatsApp follow-up, listings, and analytics in one platform.",
  openGraph: {
    title: "Lena AI for Brokers | Real Estate Operating System",
    description:
      "Run your entire brokerage from one intelligent system. Manage leads, teams, WhatsApp follow-up, listings, and analytics in one platform.",
    url: `${SITE_URL}${PATH}`,
  },
  alternates: {
    canonical: `${SITE_URL}${PATH}`,
  },
};

export default function ForBrokersPage() {
  return (
    <>
      <SolutionsPageSchema
        path={PATH}
        title="Lena AI for Brokers"
        description={metadata.description}
      />
      <SolutionsPageContent audience="brokers" />
    </>
  );
}
