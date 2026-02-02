import ClientInfo from "./_components/clientInfo";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export async function generateMetadata({ params }) {
  const { email } = await params;

  return {
    title: "Client Information - LENAAI AI Sales Agent",
    description:
      "View and manage client information in LENAAI's AI Sales Agent dashboard. Track interactions, scores, and engagement to close deals faster.",
    openGraph: {
      title: "Client Information - LENAAI AI Sales Agent",
      description:
        "View and manage client information in LENAAI's AI Sales Agent dashboard. Track interactions, scores, and engagement to close deals faster.",
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
