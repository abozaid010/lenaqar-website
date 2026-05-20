import SeoFaqPageContent from "@/components/web/seo/SeoFaqPageContent";
import { SITE_URL } from "@/app/metadata";

const PATH = "/faq";

export const metadata = {
  title: "FAQ | AI Lead Generator, AI CRM & AI Agent | Lena AI",
  description:
    "Answers for sales managers on AI lead generation, AI lead filtration, AI salesman, and AI ecosystem for developers in Egypt, UAE, and MENA.",
  openGraph: {
    title: "Lena AI FAQ | Real Estate AI Sales",
    description:
      "Answers for sales managers on AI lead generation, AI lead filtration, and Lena AI for developers in Egypt, UAE, and MENA.",
    url: `${SITE_URL}${PATH}`,
  },
  alternates: {
    canonical: `${SITE_URL}${PATH}`,
  },
};

export default function FaqPage() {
  return <SeoFaqPageContent />;
}
