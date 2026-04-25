import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Metadata } from 'next';
import UnitDetailsPage from '@/components/unit-details/unit-details-page';
import { getUnitById } from '@/lib/units/unit-api';
import { transformUnitToViewModel, generateFallbackTitle } from '@/lib/units/unit-selectors';
import { getServerTranslations } from '@/utils/getServerTranslations';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const response = await getUnitById(id);
    
    if (!response.status || !response.data.units.length) {
      return {
        title: 'Unit Not Found',
        description: 'The requested property unit could not be found.',
      };
    }

    const rawUnit = response.data.units[0];
    const cookieStore = await cookies();
    const locale = cookieStore.get('lang')?.value || 'ar';
    const { t } = getServerTranslations(locale);
    const unit = transformUnitToViewModel(rawUnit, t, locale);
    
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
  const { id } = await params;
  
  try {
    const response = await getUnitById(id);
    
    if (!response.status || !response.data.units.length) {
      notFound();
    }

    const rawUnit = response.data.units[0];
    const cookieStore = await cookies();
    const locale = cookieStore.get('lang')?.value || 'ar';
    const { t } = getServerTranslations(locale);
    const unit = transformUnitToViewModel(rawUnit, t, locale);
    
    return <UnitDetailsPage unit={unit} />;
  } catch (error) {
    console.error('Error fetching unit:', error);
    notFound();
  }
}
