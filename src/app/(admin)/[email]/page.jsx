import { notFound } from "next/navigation";
import ClientInfo from "./_components/clientInfo";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

/**
 * This segment is a client email, but as a single-segment dynamic route it also
 * matches every unmatched top-level URL — which used to render the CRM screen at
 * HTTP 200 and produce an unbounded soft-404 surface for crawlers. Anything that
 * is not an email is a genuine 404.
 */
function isClientEmail(value) {
  const decoded = (() => {
    try {
      return decodeURIComponent(String(value ?? ""));
    } catch {
      return String(value ?? "");
    }
  })();
  return /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(decoded.trim());
}

export async function generateMetadata({ params }) {
  const { email } = await params;
  // Runs before render, so the 404 status is set before the stream opens.
  if (!isClientEmail(email)) notFound();

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
  if (!isClientEmail(email)) notFound();

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
