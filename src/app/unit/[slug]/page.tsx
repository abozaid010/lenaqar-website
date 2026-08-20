import { SITE } from '@/config/site';
import { redirectLegacyToPublicCode } from '@/lib/units/unit-legacy-redirect';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const url = `${SITE.url}/unit/${encodeURIComponent(slug)}`;

  return {
    title: 'رابط فرصة عقارية قديم — لينا عقار',
    description:
      'رابط قديم لفرصة عقارية على لينا عقار. بنوجّهك لصفحة الوحدة الحالية — سعر العقد، الأقساط، والكاش قبل ما تكمل.',
    robots: { index: false, follow: true },
    openGraph: {
      title: 'رابط فرصة عقارية قديم | لينا عقار',
      description:
        'رابط قديم لفرصة عقارية على لينا عقار. بنوجّهك لصفحة الوحدة الحالية — سعر العقد، الأقساط، والكاش قبل ما تكمل.',
      url,
      locale: SITE.ogLocale,
      siteName: SITE.name,
      type: 'website',
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
      canonical: url,
    },
  };
}

export default async function UnitLegacyRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  await redirectLegacyToPublicCode(slug);
}
