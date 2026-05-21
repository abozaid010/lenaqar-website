import SolutionsPageSchema from "@/components/schema/SolutionsPageSchema";
import BrokersPageContent from "@/components/web/solutions/brokers/BrokersPageContent";
import { SITE_URL } from "@/app/metadata";

const PATH = "/for-brokers";

export const metadata = {
  title: "Lena AI For Brokers | Your AI-Powered Real Estate Company",
  description:
    "You manage. AI runs every department — full automation, lead qualification, CRM for primary/resale/rental inventory, and a B2B listing network. Built for Egyptian brokerages.",
  openGraph: {
    title: "Lena AI For Brokers | Your AI-Powered Real Estate Company",
    description:
      "Get Lena AI and everything works automatically. WhatsApp, leads, inventory, campaigns, and team workflows run 24/7 while you stay in control.",
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
        title="Lena AI For Brokers"
        description={metadata.description}
      />
      <BrokersPageContent />
    </>
  );
}
