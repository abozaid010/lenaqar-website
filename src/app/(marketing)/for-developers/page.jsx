import SolutionsPageSchema from "@/components/schema/SolutionsPageSchema";
import DevelopersPageContent from "@/components/web/solutions/developers/DevelopersPageContent";
import { SITE_URL } from "@/app/metadata";

const PATH = "/for-developers";

export const metadata = {
  title: "Lena AI OS For Real Estate Developers",
  description:
    "AI-powered operating system for Egyptian real estate developers. Automate lead handling, expand broker distribution, and track real buyer interest from one platform.",
  openGraph: {
    title: "Lena AI OS For Real Estate Developers",
    description:
      "Transform sales operations with AI customer service, broker network distribution, and real buyer analytics built for the Egyptian market.",
    url: `${SITE_URL}${PATH}`,
  },
  alternates: {
    canonical: `${SITE_URL}${PATH}`,
  },
};

export default function ForDevelopersPage() {
  return (
    <>
      <SolutionsPageSchema
        path={PATH}
        title="Lena AI OS For Real Estate Developers"
        description={metadata.description}
      />
      <DevelopersPageContent />
    </>
  );
}
