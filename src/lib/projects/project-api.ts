import axiosInstance from '@/utils/axiosInstance';
import { fetchProjectById, fetchProjects } from '@/utils/api';
import type { ProjectApiResponse, RawProject, ProjectViewModel, HeroImage, QuickFact, SpecItem, TrustItem, ProjectUnit } from './project-types';

export async function getProjectById(projectId: string): Promise<ProjectApiResponse> {
  try {
    const response = await fetchProjectById(projectId, false);
    
    if (response?.data?.project) {
      return {
        status: true,
        code: 200,
        message: 'Success',
        data: {
          project: response.data.project
        }
      };
    }
    
    throw new Error('No project data found');
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    throw error;
  }
}

export async function getProjectByEnName(enName: string): Promise<ProjectApiResponse> {
  try {
    // Import axiosInstance directly for server-side use
    const { default: axiosInstance } = await import('@/utils/axiosInstance');
    
    // Decode URL-encoded en_name
    const decodedEnName = decodeURIComponent(enName);
    
    // Fetch all projects to find by en_name with error handling
    let response;
    try {
      response = await axiosInstance.get('/projects/all');
    } catch (apiError) {
      // If /projects/all fails due to ClientsCache error, try alternative endpoints
      console.warn('Primary projects endpoint failed, trying fallback:', apiError);
      
      try {
        response = await axiosInstance.get('/projectsv2/all_projects_names');
      } catch (fallbackError) {
        console.error('All project endpoints failed:', fallbackError);
        throw new Error('Unable to fetch projects data');
      }
    }
    
    if (response.data) {
      let projects = [];
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        projects = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        projects = response.data.data;
      } else if (response.data.projects && Array.isArray(response.data.projects)) {
        projects = response.data.projects;
      }
      
      // Try multiple matching strategies
      const project = projects.find((p: RawProject) => {
        if (!p.en_name) return false;
        
        // Exact match (case-insensitive)
        if (p.en_name.toLowerCase() === decodedEnName.toLowerCase()) {
          return true;
        }
        
        // URL-encoded match
        if (encodeURIComponent(p.en_name).toLowerCase() === enName.toLowerCase()) {
          return true;
        }
        
        // Space replacement match (for URLs with %20)
        const normalizedProject = p.en_name.replace(/\s+/g, ' ').toLowerCase();
        const normalizedSearch = decodedEnName.replace(/%20/g, ' ').toLowerCase();
        if (normalizedProject === normalizedSearch) {
          return true;
        }
        
        return false;
      });
      
      if (project) {
        return {
          status: true,
          code: 200,
          message: 'Success',
          data: {
            project
          }
        };
      }
    }
    
    // Log available projects for debugging
    console.log('Available projects en_name values:');
    if (response.data) {
      let projects = [];
      if (Array.isArray(response.data)) {
        projects = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        projects = response.data.data;
      } else if (response.data.projects && Array.isArray(response.data.projects)) {
        projects = response.data.projects;
      }
      projects.forEach((p: RawProject) => {
        console.log(`- "${p.en_name}" (ID: ${p.id})`);
      });
    }
    
    throw new Error(`Project with en_name "${enName}" (decoded: "${decodedEnName}") not found`);
  } catch (error) {
    console.error('Error fetching project by en_name:', error);
    throw error;
  }
}

type T = Record<string, any> | null | undefined;
const getT = (t: T, ...path: string[]): string | null => {
  if (!t) return null;
  let val: any = t;
  for (const k of path) {
    if (val === null || val === undefined || typeof val !== 'object') return null;
    val = val[k];
  }
  return typeof val === 'string' && val.length > 0 ? val : null;
};

export function transformProjectToViewModel(rawProject: RawProject, t?: T, locale: string = 'en'): ProjectViewModel {
  const intlLocale = locale === 'ar' ? 'ar-EG' : 'en-US';

  const formatDate = (val: string | Date): string => {
    try {
      return new Intl.DateTimeFormat(intlLocale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(val));
    } catch {
      return String(val);
    }
  };

  const yearsLabel = getT(t, 'projectPage', 'years') || 'yrs';
  const formatDelivery = (val: number | string): string =>
    typeof val === 'number' ? `${val} ${yearsLabel}` : formatDate(val);

  const localeName = locale === 'ar'
    ? (rawProject.ar_name || rawProject.en_name || '')
    : (rawProject.en_name || rawProject.ar_name || '');

  // Transform hero images
  const heroImages: HeroImage[] = [];
  if (rawProject.master_plan?.url) {
    heroImages.push({ url: rawProject.master_plan.url, alt: localeName || 'Project' });
  }

  // Build quick facts
  const quickFacts: QuickFact[] = [];

  if (rawProject.units_count || rawProject.total_units) {
    quickFacts.push({
      label: getT(t, 'projectPage', 'totalUnits') || 'Total Units',
      value: (rawProject.units_count || rawProject.total_units).toString(),
      icon: 'building'
    });
  }

  if (rawProject.city) {
    quickFacts.push({
      label: getT(t, 'propertyDetails', 'location') || 'Location',
      value: `${rawProject.city}${rawProject.district ? ', ' + rawProject.district : ''}`,
      icon: 'map-pin'
    });
  }

  if (rawProject.delivery_date) {
    quickFacts.push({
      label: getT(t, 'unitDetails', 'deliveryDate') || 'Delivery Date',
      value: formatDelivery(rawProject.delivery_date),
      icon: 'calendar'
    });
  }

  if (rawProject.properties_types && rawProject.properties_types.length > 0) {
    quickFacts.push({
      label: getT(t, 'projectPage', 'propertyTypes') || 'Property Types',
      value: rawProject.properties_types.join(', '),
      icon: 'home'
    });
  }

  if (rawProject.area || rawProject.start_area) {
    quickFacts.push({
      label: getT(t, 'projectPage', 'startingArea') || 'Starting Area',
      value: `${rawProject.start_area || rawProject.area} m²`,
      icon: 'maximize'
    });
  }

  // Build specifications
  const specs: SpecItem[] = [];

  if (rawProject.status) {
    specs.push({
      label: getT(t, 'projectPage', 'status') || 'Status',
      value: rawProject.status
    });
  }

  if (rawProject.phases && rawProject.phases.length > 0) {
    specs.push({
      label: getT(t, 'projectPage', 'phases') || 'Phases',
      value: rawProject.phases.join(', ')
    });
  }

  if (rawProject.start_price || rawProject.starting_price) {
    const price = rawProject.start_price || rawProject.starting_price;
    specs.push({
      label: getT(t, 'projectPage', 'startingPrice') || 'Starting Price',
      value: `EGP ${price.toLocaleString('en-US')}`
    });
  }

  if (rawProject.average_price_per_meter) {
    specs.push({
      label: getT(t, 'projectPage', 'avgPricePerM2') || 'Avg Price / m²',
      value: `EGP ${rawProject.average_price_per_meter.toLocaleString('en-US')}`
    });
  }

  if (rawProject.gated !== undefined) {
    specs.push({
      label: getT(t, 'projectPage', 'gatedCommunity') || 'Gated Community',
      value: rawProject.gated
        ? (getT(t, 'common', 'yes') || 'Yes')
        : (getT(t, 'common', 'no') || 'No')
    });
  }

  // Build trust items
  const trustItems: TrustItem[] = [];

  trustItems.push({
    label: getT(t, 'projectPage', 'projectId') || 'Project ID',
    value: rawProject.id
  });

  if (rawProject.created_at) {
    trustItems.push({
      label: getT(t, 'projectPage', 'created') || 'Created',
      value: formatDate(rawProject.created_at)
    });
  }

  if (rawProject.updated_at) {
    trustItems.push({
      label: getT(t, 'unitLabels', 'lastUpdated') || 'Last Updated',
      value: formatDate(rawProject.updated_at)
    });
  }

  // Create badges
  const badges: string[] = [];
  if (rawProject.status) badges.push(rawProject.status);
  if (rawProject.phases && rawProject.phases.length > 0) {
    const phasesLabel = getT(t, 'projectPage', 'phases') || 'Phases';
    badges.push(`${rawProject.phases.length} ${phasesLabel}`);
  }

  // Build full gallery: master_plan first, then all images[]
  const galleryImages: HeroImage[] = [...heroImages];
  if (rawProject.images && Array.isArray(rawProject.images)) {
    for (const img of rawProject.images) {
      if (img.url && !galleryImages.some(h => h.url === img.url)) {
        galleryImages.push({ url: img.url, alt: localeName || 'Project image' });
      }
    }
  }

  // Build building type images map: type → url[]
  const buildingTypeImages: Record<string, string[]> = {};
  if (rawProject.building_types_images) {
    for (const [type, imgs] of Object.entries(rawProject.building_types_images)) {
      buildingTypeImages[type] = (imgs as any[]).map((img: any) => img.url).filter(Boolean);
    }
  }

  const deliveryDateLabel = rawProject.delivery_date
    ? formatDelivery(rawProject.delivery_date)
    : undefined;

  return {
    id: rawProject.id,
    title: localeName || 'Untitled Project',
    titleAr: rawProject.ar_name || rawProject.en_name || 'Untitled Project',
    description: rawProject.description,
    developerName: rawProject.developer_name || rawProject.developer,
    developerId: rawProject.developer_id,
    developerHref: rawProject.developer_id ? `/developers/${rawProject.developer_id}` : null,
    locationLabel: `${rawProject.city}${rawProject.district ? ', ' + rawProject.district : ''}`,
    heroImages: galleryImages.length > 0 ? galleryImages : heroImages,
    galleryImages,
    badges,
    startingPrice: (rawProject.start_price || rawProject.starting_price)
      ? `EGP ${(rawProject.start_price || rawProject.starting_price).toLocaleString('en-US')}`
      : undefined,
    averagePricePerMeter: rawProject.average_price_per_meter
      ? `EGP ${rawProject.average_price_per_meter.toLocaleString('en-US')}`
      : undefined,
    totalUnits: (rawProject.units_count || rawProject.total_units)?.toString(),
    deliveryDateLabel,
    referenceCode: rawProject.id,
    quickFacts,
    specs,
    trustItems,
    status: rawProject.status,
    phases: rawProject.phases || [],
    amenities: rawProject.amenities || [],
    paymentPlans: rawProject.payment_plans?.map(plan => plan.name) || [],
    paymentPlanDetails: rawProject.payment_plans || [],
    buildingTypes: rawProject.properties_types || rawProject.building_types || [],
    buildingTypeImages,
    startPrices: rawProject.start_prices || {},
    startAreas: rawProject.start_areas || {},
    finishingTypes: rawProject.finishing_type || [],
    googleMapLink: rawProject.google_map_link,
    videoUrl: rawProject.video_url,
    orientationUrl: rawProject.orientation_url,
    locationLandmark: rawProject.location_landmark,
    latitude: rawProject.latitude,
    longitude: rawProject.longitude,
    isActive: rawProject.is_active ?? true,
    facilityManagement: rawProject.facility_management,
    units: [],
    purpose: rawProject.status,
    isPrimary: false,
    clientId: rawProject.client_id,
  };
}

export async function getProjectUnits(projectId: string): Promise<ProjectUnit[]> {
  try {
    // This would need to be implemented based on your API
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Error fetching project units:', error);
    return [];
  }
}
