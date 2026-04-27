// Raw API response types
export interface ProjectImage {
  fileId?: string;
  url: string;
  source?: string;
}

export interface RawProject {
  id: string;
  en_name: string;
  ar_name: string;
  description?: string;
  master_plan?: ProjectImage;
  city: string;
  district: string;
  country?: string;
  developer_id?: string;
  developer?: string;
  developer_name?: string;
  google_map_link?: string;
  video_url?: string;
  status?: string;
  phases?: (string | { id: string; name: string; description?: string; master_plan?: any; images?: any; building_types_images?: any; is_active?: boolean; updated_at?: string })[];
  delivery_date?: string | number;
  total_units?: number;
  client_id?: string;
  created_at?: string;
  updated_at?: string;
  units_count?: number;
  amenities?: string[];
  payment_plans?: PaymentPlan[];
  building_types?: string[];
  properties_types?: string[];
  starting_price?: number;
  start_price?: number;
  average_price_per_meter?: number;
  start_prices?: Record<string, number>;
  start_areas?: Record<string, number>;
  start_area?: number;
  area?: number;
  gated?: boolean;
  images?: ProjectImage[];
  building_types_images?: Record<string, ProjectImage[]>;
  finishing_type?: string[];
  author?: string;
  orientation_url?: string;
  facility_management?: { name: string; description?: string; rating?: number } | null;
  cache_discount?: number;
  location_landmark?: string;
  latitude?: number;
  longitude?: number;
  primary_units_sold_out?: boolean;
}

export interface PaymentPlan {
  id: string;
  name: string;
  downpayment_percentage: number;
  installment_years: number;
  delivery_in_years: number;
  cache_discount: number;
  maintenance_fee: number;
  installment_increasing_percentage: number;
  extra_payments: any[];
  description: string;
  is_default: boolean;
}

export interface ProjectApiResponse {
  status: boolean;
  code: number;
  message: string;
  data: {
    project: RawProject;
  };
  error_message?: string;
}

// Normalized view model types
export interface HeroImage {
  url: string;
  alt: string;
}

export interface QuickFact {
  label: string;
  value: string;
  icon?: string;
}

export interface SpecItem {
  label: string;
  value: string;
}

export interface TrustItem {
  label: string;
  value: string;
}

export interface ProjectUnit {
  id: string;
  unitTitle: string;
  buildingType: string;
  roomsCount: number;
  landArea: number;
  totalPrice: number;
  purpose: string;
  phase?: string;
}

export interface ProjectViewModel {
  id: string;
  title: string;
  titleAr: string;
  description?: string;
  developerName?: string;
  developerId?: string;
  developerHref?: string;
  locationLabel: string;
  heroImages: HeroImage[];
  galleryImages: HeroImage[];
  badges: string[];
  startingPrice?: string;
  averagePricePerMeter?: string;
  totalUnits?: string;
  deliveryDateLabel?: string;
  referenceCode?: string;
  quickFacts: QuickFact[];
  specs: SpecItem[];
  trustItems: TrustItem[];
  status?: string;
  phases: string[];
  amenities: string[];
  paymentPlans: string[];
  paymentPlanDetails: PaymentPlan[];
  buildingTypes: string[];
  buildingTypeImages: Record<string, string[]>;
  startPrices: Record<string, number>;
  startAreas: Record<string, number>;
  finishingTypes: string[];
  googleMapLink?: string;
  videoUrl?: string;
  orientationUrl?: string;
  locationLandmark?: string;
  latitude?: number;
  longitude?: number;
  primaryUnitsSoldOut: boolean;
  facilityManagement?: { name: string; description?: string; rating?: number } | null;
  units: ProjectUnit[];
  purpose?: string;
  isPrimary: boolean;
  clientId?: string;
}

// Component prop types
export interface ProjectHeroGalleryProps {
  images: HeroImage[];
  isPrimary: boolean;
}

export interface ProjectHeaderSummaryProps {
  project: ProjectViewModel;
}

export interface ProjectQuickFactsProps {
  facts: QuickFact[];
}

export interface ProjectSpecificationsProps {
  specs: SpecItem[];
}

export interface ProjectLocationContextProps {
  project: ProjectViewModel;
}

export interface ProjectUnitsSectionProps {
  project: ProjectViewModel;
}

export interface RelatedEntityLinksProps {
  project: ProjectViewModel;
}

export interface ProjectInquiryCardProps {
  project: ProjectViewModel;
}

export interface ProjectStickyActionBarProps {
  project: ProjectViewModel;
}

export interface SectionBlockProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export interface InfoRowProps {
  label: string;
  value: string | null;
  className?: string;
}

export interface ProjectDetailsSkeletonProps {
  // No props needed for skeleton
}

export interface ProjectDetailsErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export interface ProjectBreadcrumbsProps {
  project: ProjectViewModel;
}

export interface ProjectBadgesProps {
  badges: string[];
}
