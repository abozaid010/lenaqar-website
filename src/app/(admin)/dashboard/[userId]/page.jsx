import ChatClientWrapper from "./_components/chat-client-wrapper";
import { SITE_URL } from "../../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export async function generateMetadata({ params }) {
  const { userId } = await params;

  return {
    title: "Client Chat - LENAAI AI CRM",
    description:
      "Chat with client and manage communications through LENAAI's AI-powered CRM. Use our AI Sales Agent to engage with clients and close deals.",
    openGraph: {
      title: "Client Chat - LENAAI AI CRM",
      description:
        "Chat with clients using LENAAI's AI-powered CRM platform.",
      url: `${SITE_URL}/dashboard/${userId}`,
      type: "website",
    },
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}/dashboard/${userId}`,
    },
  };
}

export default async function ChatPage({ params }) {
  const { userId } = await params;

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "Dashboard",
            url: `${SITE_URL}/dashboard`,
          },
          {
            name: "Client Chat",
            url: `${SITE_URL}/dashboard/${userId}`,
          },
        ]}
      />
      <div className="container flex flex-col gap-3 relative pb-4 overflow-hidden h-full">
        <ChatClientWrapper userId={userId} />
      </div>
    </>
  );
}
