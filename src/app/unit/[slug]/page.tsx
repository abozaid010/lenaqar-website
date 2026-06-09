import { Metadata } from 'next';
import { redirectLegacyToPublicCode } from '@/lib/units/unit-legacy-redirect';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: 'Property Details',
    description: 'View property details, pricing, and specifications.',
    alternates: {
      canonical: `/allProberties/${slug}`,
    },
  };
}

export default async function UnitLegacyRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  await redirectLegacyToPublicCode(slug);
}
