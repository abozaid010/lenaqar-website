import { notFound } from "next/navigation";
import { SITE } from "@/config/site";
import { fetchOpportunities, fetchOpportunityByCode } from "@/lib/lenaqar/opportunities.server";
import OpportunityDetailContent from "./opportunity-detail-content";

export const revalidate = 900;

export async function generateStaticParams() {
  if (!SITE.feed.enabled) return [];
  const units = await fetchOpportunities();
  return units.map((unit) => ({ slug: unit.code }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const unit = await fetchOpportunityByCode(slug);
  const project = unit?.projectAr || unit?.project || slug;
  const title = `${project} | فرصة كاش من لينا عقار`;
  const description = unit
    ? `وحدة في ${project} من ${unit.developerAr || unit.developer || "المطور"}. الكاش المطلوب والتفاصيل من سعر المطور بتاريخه — من غير تقدير.`
    : "تفاصيل الوحدة غير متاحة حالياً على لينا عقار. راجع قائمة الفرص أو تواصل معنا على واتساب.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE.url}/opportunities/${encodeURIComponent(slug)}`,
      locale: "ar_EG",
      siteName: SITE.name,
      type: "website",
      images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
    },
    alternates: {
      canonical: `${SITE.url}/opportunities/${encodeURIComponent(slug)}`,
    },
  };
}

export default async function OpportunityDetailPage({ params }) {
  const { slug } = await params;
  const unit = await fetchOpportunityByCode(slug);
  if (!unit) notFound();
  return <OpportunityDetailContent unit={unit} />;
}
