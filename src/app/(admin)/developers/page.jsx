import { cookies } from "next/headers";
import DevelopersClientWrapper from "./_components/developers-client-wrapper";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export const metadata = {
  title: "Developers - Real Estate Developers Directory | LENAAI AI CRM",
  description:
    "Browse our directory of real estate developers in Egypt. Discover trusted developers, their projects, and property portfolios. Powered by LENAAI AI.",
  keywords: [
    "real estate developers",
    "developers Egypt",
    "property developers",
    "construction companies",
  ],
  openGraph: {
    title: "Developers | LENAAI",
    description:
      "Browse our directory of real estate developers in Egypt. Discover trusted developers and their projects.",
    url: `${SITE_URL}/developers`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Developers | LENAAI",
    description: "Browse real estate developers in Egypt",
  },
  alternates: {
    canonical: `${SITE_URL}/developers`,
  },
};

export default async function DevelopersPage() {
  const cookieStore = await cookies();
  const clientId = cookieStore.get("lena-website-client_id")?.value || null;

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Developers",
            url: `${SITE_URL}/developers`,
          },
        ]}
      />
      <DevelopersClientWrapper clientId={clientId} />
    </>
  );
}
