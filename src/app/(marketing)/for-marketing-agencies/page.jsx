import SolutionsPageSchema from "@/components/schema/SolutionsPageSchema";
import AgenciesPageContent from "@/components/web/solutions/agencies/AgenciesPageContent";
import { SITE_URL } from "@/app/metadata";

const PATH = "/for-marketing-agencies";

export const metadata = {
  title: "For Marketing Agencies | Where AI Meets Real Estate Growth",
  description:
    "Marketing agencies lose revenue after the click. Lena AI is your first sales layer — instant lead response, smart qualification, and higher campaign ROI.",
  openGraph: {
    title: "Lena AI for Marketing Agencies | Real Estate Operating System",
    description:
      "Offer premium real estate automation to your clients. Help them convert leads faster while creating recurring revenue for your agency.",
    url: `${SITE_URL}${PATH}`,
  },
  alternates: {
    canonical: `${SITE_URL}${PATH}`,
  },
};

export default function ForMarketingAgenciesPage() {
  return (
    <>
      <SolutionsPageSchema
        path={PATH}
        title="Lena AI for Marketing Agencies"
        description={metadata.description}
      />
      <AgenciesPageContent />
    </>
  );
}
