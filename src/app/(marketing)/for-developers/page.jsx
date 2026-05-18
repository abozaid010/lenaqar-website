import SolutionsPageSchema from "@/components/schema/SolutionsPageSchema";
import DevelopersPageContent from "@/components/web/solutions/developers/DevelopersPageContent";
import { SITE_URL } from "@/app/metadata";

const PATH = "/for-developers";

export const metadata = {
  title: "For Developers | Real Estate Operating System",
  description:
    "Move inventory faster with a connected broker network. Share projects, qualify leads, and track sales performance from one platform.",
  openGraph: {
    title: "Lena AI for Developers | Real Estate Operating System",
    description:
      "Move inventory faster with a connected broker network. Share projects, qualify leads, and track sales performance from one platform.",
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
        title="Lena AI for Developers"
        description={metadata.description}
      />
      <DevelopersPageContent />
    </>
  );
}
