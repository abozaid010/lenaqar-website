import SeoBlogIndexContent from "@/components/web/seo/SeoBlogIndexContent";
import { SITE_URL } from "@/app/metadata";

const PATH = "/blog";

export const metadata = {
  title: "Blog | AI Lead Generation & CRM for Real Estate MENA | Lena AI",
  description:
    "Guides for sales leaders on AI lead generator, AI lead filtration, AI CRM, and AI ecosystem for developers in Egypt, UAE, and MENA.",
  openGraph: {
    title: "Lena AI Blog | Real Estate AI Sales",
    description:
      "Guides for sales leaders on AI lead generation, filtration, and sales automation for developers in Egypt, UAE, and MENA.",
    url: `${SITE_URL}${PATH}`,
  },
  alternates: {
    canonical: `${SITE_URL}${PATH}`,
  },
};

export default function BlogIndexPage() {
  return <SeoBlogIndexContent />;
}
