import { Metadata } from 'next';
import { redirectLegacyIdToPublicCode } from '@/lib/units/unit-legacy-redirect';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: 'Property Details',
    description: 'View property details, pricing, and specifications.',
  };
}

export default async function PropertyLegacyRedirectPage({ params }: PageProps) {
  const { id } = await params;
  await redirectLegacyIdToPublicCode(id);
}
