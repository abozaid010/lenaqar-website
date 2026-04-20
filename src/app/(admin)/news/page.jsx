import { redirect } from "next/navigation";
import { SITE_URL } from "../../metadata";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";
import NewsFeed from "./_components/news-feed";
import { canManageTeamFromToken, getRoleFromToken } from "@/lib/getRoleFromToken";

export const metadata = {
  title: "News - Real Estate News & Updates | LENAAI AI Sales Agent",
  description:
    "Stay updated with the latest real estate news, market trends, and industry insights. Powered by LENAAI AI.",
  keywords: [
    "real estate news",
    "property news",
    "market updates",
    "real estate Egypt",
  ],
  openGraph: {
    title: "News | LENAAI",
    description:
      "Stay updated with the latest real estate news and market trends in Egypt.",
    url: `${SITE_URL}/news`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "News | LENAAI",
    description: "Latest real estate news and updates",
  },
  alternates: {
    canonical: `${SITE_URL}/news`,
  },
};

export default async function NewsPage() {
  const canManageTeam = await canManageTeamFromToken();
  const role = await getRoleFromToken();
  const canAccessNews = canManageTeam || role?.toLowerCase() === "editor";
  if (!canAccessNews) {
    redirect("/dashboard");
  }

  return (
    <>
      <BreadcrumbSchema
        items={[
          {
            name: "News",
            url: `${SITE_URL}/news`,
          },
        ]}
      />
      <div className="bg-gray-50 min-h-screen py-6">
        <NewsFeed />
      </div>
    </>
  );
}

