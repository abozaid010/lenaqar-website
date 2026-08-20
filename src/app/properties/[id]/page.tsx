import { SITE } from '@/config/site';
import { redirectLegacyIdToPublicCode } from '@/lib/units/unit-legacy-redirect';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const url = `${SITE.url}/properties/${encodeURIComponent(id)}`;

  return {
    title: 'رابط وحدة قديم — فرص عقارية على لينا عقار',
    description:
      'رابط قديم لوحدة معروضة على لينا عقار. بنوجّهك تلقائياً لصفحة الفرصة العقارية المناسبة — سعر، أقساط، وكاش مطلوب.',
    robots: { index: false, follow: true },
    openGraph: {
      title: 'رابط وحدة قديم — فرص عقارية | لينا عقار',
      description:
        'رابط قديم لوحدة معروضة على لينا عقار. بنوجّهك تلقائياً لصفحة الفرصة العقارية المناسبة — سعر، أقساط، وكاش مطلوب.',
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

export default async function PropertyLegacyRedirectPage({ params }: PageProps) {
  const { id } = await params;
  await redirectLegacyIdToPublicCode(id);
}
