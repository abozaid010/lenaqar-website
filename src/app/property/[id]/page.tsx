import { SITE } from '@/config/site';
import { redirectLegacyIdToPublicCode } from '@/lib/units/unit-legacy-redirect';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const url = `${SITE.url}/property/${encodeURIComponent(id)}`;

  return {
    title: 'رابط عقار قديم — إعادة توجيه لفرصة على لينا عقار',
    description:
      'رابط قديم لعقار على لينا عقار. بنحوّلك لصفحة الفرصة العقارية الصحيحة — تفاصيل الوحدة، الأقساط، والكاش المطلوب.',
    robots: { index: false, follow: true },
    openGraph: {
      title: 'رابط عقار قديم — فرصة عقارية | لينا عقار',
      description:
        'رابط قديم لعقار على لينا عقار. بنحوّلك لصفحة الفرصة العقارية الصحيحة — تفاصيل الوحدة، الأقساط، والكاش المطلوب.',
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
