import Link from "next/link";
import { SITE } from "@/config/site";
import { getCities } from "@/lib/guides/cities";
import {
  getBuyingGuides,
  getCompareGuides,
  getCityHub,
  loadAllGuides,
} from "@/lib/guides/load";
import BreadcrumbSchema from "@/components/schema/BreadcrumbSchema";

export const metadata = {
  title: "دليل المشتري في مصر | لينا عقار",
  description:
    "دليل المشتري العقاري في مصر من لينا عقار: خرائط أسعار، مميزات وعيوب المدن، قوائم فحص، ومقارنات — بدون مكالمات باردة.",
  openGraph: {
    title: "دليل المشتري في مصر | لينا عقار",
    description:
      "خرائط أسعار ومقارنات وقوائم فحص لمشتري العقارات في مصر — لينا عقار.",
    url: `${SITE.url}/guides`,
    locale: "ar_EG",
    siteName: SITE.name,
    type: "website",
    images: [
      {
        url: `${SITE.url}/images/logo.png`,
        width: 1200,
        height: 630,
        alt: SITE.name,
      },
    ],
  },
  alternates: {
    canonical: `${SITE.url}/guides`,
    languages: {
      "ar-EG": `${SITE.url}/guides`,
      "x-default": `${SITE.url}/guides`,
    },
  },
};

export default function GuidesIndexPage() {
  const cities = getCities();
  const published = loadAllGuides();
  const buying = getBuyingGuides();
  const compare = getCompareGuides();
  const publishedSlugs = new Set(published.map((g) => g.slug));

  return (
    <>
      <BreadcrumbSchema
        items={[{ name: "دليل المشتري في مصر", url: `${SITE.url}/guides` }]}
      />
      <div className="container py-10 sm:py-14 pb-24 lg:pb-14 max-w-3xl space-y-12">
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">
            دليل المشتري في مصر
          </h1>
          <p className="text-base sm:text-lg text-black/75 leading-relaxed">
            مش بنبيعلك اللي عندنا.. بنلاقي لك اللي إنت عايزه. هنا خرائط أسعار،
            ملفات حمراء وخضراء، ومقارنات مدن — بأرقام بتاريخ ومصدر، واتساب فقط
            من غير مكالمات باردة.
          </p>
        </header>

        <section className="space-y-4" aria-labelledby="cities-heading">
          <h2 id="cities-heading" className="text-xl font-bold text-primary">
            أدلة المدن
          </h2>
          <ul className="space-y-3">
            {cities.map((city) => {
              const hub = getCityHub(city.id, { allowPreview: true });
              const live = hub && publishedSlugs.has(hub.slug);
              return (
                <li key={city.id}>
                  {live ? (
                    <Link
                      href={`/guides/${city.id}/`}
                      className="block rounded-2xl border border-primary/15 bg-white p-5 hover:bg-primary/[0.03] transition-colors"
                    >
                      <h3 className="text-lg font-bold text-primary">
                        {city.name_ar}
                      </h3>
                      <p className="mt-1 text-sm text-black/65">
                        {city.name_en} — خريطة أسعار، مميزات وعيوب، ووحدات
                        حقيقية
                      </p>
                    </Link>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-primary/20 bg-white/60 p-5 opacity-80">
                      <h3 className="text-lg font-bold text-primary">
                        {city.name_ar}
                      </h3>
                      <p className="mt-1 text-sm text-black/55">
                        قريبًا — المسودة قيد المراجعة (لن تُنشر قبل الموافقة)
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {buying.length > 0 ? (
          <section className="space-y-4" aria-labelledby="buying-heading">
            <h2 id="buying-heading" className="text-xl font-bold text-primary">
              أدلة الشراء
            </h2>
            <ul className="space-y-3">
              {buying.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={guide.slug}
                    className="block rounded-2xl border border-primary/15 bg-white p-5 hover:bg-primary/[0.03] transition-colors"
                  >
                    <h3 className="text-lg font-bold text-primary">
                      {guide.h1 || guide.title}
                    </h3>
                    <p className="mt-2 text-sm text-black/70 leading-relaxed">
                      {guide.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {compare.length > 0 ? (
          <section className="space-y-4" aria-labelledby="compare-heading">
            <h2 id="compare-heading" className="text-xl font-bold text-primary">
              مقارنات المدن
            </h2>
            <ul className="space-y-3">
              {compare.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={guide.slug}
                    className="block rounded-2xl border border-primary/15 bg-white p-5 hover:bg-primary/[0.03] transition-colors"
                  >
                    <h3 className="text-lg font-bold text-primary">
                      {guide.h1 || guide.title}
                    </h3>
                    <p className="mt-2 text-sm text-black/70 leading-relaxed">
                      {guide.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="text-sm text-black/55">
          المقالات المنشورة فقط تظهر هنا وفي نتائج البحث. المسودات للمعاينة
          الداخلية فقط.
        </p>
      </div>
    </>
  );
}
