import Link from "next/link";
import { SITE } from "@/config/site";
import { BUYER_GUIDES } from "@/lib/lenaqar/buyer-guides";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export const metadata = {
  title: "دليل المشتري — اكتب طلبك بشكل أوضح",
  description:
    "مقالات عملية لمشتري العقارات في مصر: إزاي تكتب طلب عقاري واضح، والفرق بين إعادة البيع والوحدات الجديدة — من غير إحصائيات مخترعة.",
  openGraph: {
    title: "دليل المشتري | لينا عقار",
    description:
      "مقالات عملية لمشتري العقارات في مصر: كتابة الطلب والفرق بين الريسيل والإطلاق الجديد.",
    url: `${SITE.url}/guides`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [{ url: `${SITE.url}/images/logo.png`, width: 1200, height: 630, alt: SITE.name }],
  },
  alternates: { canonical: `${SITE.url}/guides` },
};

export default function GuidesIndexPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "دليل المشتري", url: `${SITE.url}/guides` }]} />
      <div className="container py-10 sm:py-14 pb-24 lg:pb-14 max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">دليل المشتري</h1>
          <p className="text-base sm:text-lg text-black/75 leading-relaxed">
            مقالات قصيرة عشان تكتب طلب أوضح وتفهم اختياراتك — من غير إحصائيات أو وعود مش
            مدعومة.
          </p>
        </header>
        <ul className="space-y-4">
          {BUYER_GUIDES.map((guide) => (
            <li key={guide.href}>
              <Link
                href={guide.href}
                className="block rounded-2xl border border-primary/15 bg-white p-5 hover:bg-primary/[0.03] transition-colors"
              >
                <h2 className="text-lg font-bold text-primary">{guide.h1}</h2>
                <p className="mt-2 text-sm text-black/70 leading-relaxed">{guide.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
