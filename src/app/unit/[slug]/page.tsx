import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import UnitDetailsPage from '@/components/unit-details/unit-details-page';
import { getUnitById } from '@/lib/units/unit-api';
import { findUnitBySlug } from '@/lib/units/unit-url-utils';
import { transformUnitToViewModel, generateFallbackTitle } from '@/lib/units/unit-selectors';
import { getRoleFromToken } from '@/lib/getRoleFromToken';
import { cookies } from 'next/headers';
import { COOKIE_KEYS } from '@/constants/cookieKeys';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    // First try to find unit by slug
    const unitId = await findUnitBySlug(slug);
    
    if (!unitId) {
      return {
        title: 'Unit Not Found',
        description: 'The requested property unit could not be found.',
      };
    }

    const response = await getUnitById(unitId);
    
    if (!response.status || !response.data.units.length) {
      return {
        title: 'Unit Not Found',
        description: 'The requested property unit could not be found.',
      };
    }

    const rawUnit = response.data.units[0];
    const unit = transformUnitToViewModel(rawUnit);
    
    const title = unit.title || generateFallbackTitle(rawUnit);
    const description = unit.projectName && unit.locationLabel
      ? `Explore this ${title.toLowerCase()} by ${unit.developerName}, located in ${unit.locationLabel}. View price, payment plan, delivery date, and full unit specifications.`
      : `Explore this property listing. View price, payment plan, delivery date, and full unit specifications.`;

    return {
      title: `${title} | ${unit.projectName || 'Property'} | ${unit.developerName || 'Developer'}`,
      description,
      openGraph: {
        title: `${title} | ${unit.projectName || 'Property'}`,
        description,
        images: unit.heroImages.length > 0 ? [{
          url: unit.heroImages[0].url,
          alt: unit.heroImages[0].alt,
        }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | ${unit.projectName || 'Property'}`,
        description,
        images: unit.heroImages.length > 0 ? [unit.heroImages[0].url] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Property Details',
      description: 'View property details, pricing, and specifications.',
    };
  }
}

export default async function UnitPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Check if user is admin and redirect to admin route with sidebar
  const role = await getRoleFromToken();
  const cookieStore = await cookies();
  const clientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value;
  
  // If user is admin and clientId exists, redirect to admin route with sidebar
  if (role && clientId) {
    const adminRoles = ['admin', 'owner', 'editor'];
    if (adminRoles.includes(role.toLowerCase())) {
      redirect(`/admin/units/${slug}`);
    }
  }

  try {
    // First try to find unit by slug
    const unitId = await findUnitBySlug(slug);
    
    if (!unitId) {
      notFound();
    }

    const response = await getUnitById(unitId);
    
    if (!response.status || !response.data.units.length) {
      notFound();
    }

    const rawUnit = response.data.units[0];
    const unit = transformUnitToViewModel(rawUnit);
    
    return <UnitDetailsPage unit={unit} />;
  } catch (error) {
    console.error('Error fetching unit:', error);
    notFound();
  }
}
