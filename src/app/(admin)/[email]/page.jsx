import ClientInfo from "./_components/clientInfo";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export async function generateMetadata({ params }) {
  const { email } = await params;

  return {
    title: "Client Information - LENAAI AI Sales Agent",
    description:
      "View and manage client information in LENAAI's AI-powered CRM. Track client interactions, scores, and engagement with our AI Sales Agent platform.",
    openGraph: {
      title: "Client Information - LENAAI AI Sales Agent",
      description:
        "View and manage client information in LENAAI's AI-powered CRM. Track client interactions, scores, and engagement with our AI Sales Agent platform.",
      url: `${SITE_URL}/${email}`,
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}/${email}`,
    },
  };
}

export default async function ClientPage({ params }) {
  const { email } = await params;

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Client Information",
            url: `${SITE_URL}/${email}`,
          },
        ]}
      />
      <ClientInfo client_email={email} />
    </>
  );
}
