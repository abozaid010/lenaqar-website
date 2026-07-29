// Raw API response types
export interface UnitImage {
  fileId: string;
  url: string;
  source: string;
}

export interface RawUnit {
  is_primary: boolean;
  images: UnitImage[];
  project_ar: string;
  project_en_name?: string;
  phase: string;
  clientId: string;
  city: string;
  downPayment: number;
  dataSource: string;
  installment_years: number;
  /** Remaining principal for installments (sale units). */
  remaining_amount?: number | null;
  /** Paid amount so far (sale units). */
  paid_amount?: number | null;
  /** Offer / over price (sale units). OpenAPI: "Offer price". */
  over_price?: number | null;
  landArea: number;
  buildingType: string;
  bathroomCount: number;
  unitTitle: string;
  developer_id: string;
  project: string;
  garageArea: number;
  deliveryDate: string;
  purpose: string;
  installment_amount_yearly: number;
  clientName: string;
  code: string;
  project_id: string;
  updatedAt: string;
  totalPrice: number;
  monthlyRentPrice?: number | null;
  gardenSize: number;
  district: string;
  sub_district?: string;
  roomsCount: number;
  unitId: string;
  country: string;
  furnishing: string;
  roof_area: number;
  finishing: string;
  developer: string;
  owner_name?: string;
  owner_mobile?: string;
  notes?: string;
  video?: string;
  visibility?: string;
  status?: string;
  author?: string;
}

export interface UnitApiResponse {
  status: boolean;
  code: number;
  message: string;
  data: {
    units: RawUnit[];
  };
}

// Normalized view model types
export interface HeroImage {
  url: string;
  alt: string;
  type?: 'image' | 'video';
  provider?: 'youtube' | 'facebook' | 'file';
}

export interface QuickFact {
  key?: string;
  label: string;
  value: string;
  icon?: string;
}

export interface SpecItem {
  key?: string;
  label: string;
  value: string;
}

export interface TrustItem {
  key?: string;
  label: string;
  value: string;
}

export interface UnitViewModel {
  id: string;
  title: string | null;
  projectName: string | null;
  projectNameAr: string | null;
  developerName: string | null;
  projectId: string | null;
  developerId: string | null;
  projectHref: string | null;
  developerHref: string | null;
  developerPhone: string | null;
  developerWhatsapp: string | null;
  ownerName: string | null;
  ownerMobile: string | null; // Updated from ownerPhone to match JSON
  ownerWhatsapp: string | null;
  clientId: string | null;
  isPrimary: boolean;
  locationLabel: string | null;
  city: string | null;
  district: string | null;
  subDistrict: string | null;
  heroImages: HeroImage[];
  badges: string[];
  totalPrice: string | null;
  monthlyRentPrice: string | null;
  downPayment: string | null;
  /** Formatted `over_price` (offer). */
  overPrice: string | null;
  /** Formatted `remaining_amount`. */
  remainingAmount: string | null;
  /** Formatted `paid_amount`. */
  paidAmount: string | null;
  yearlyInstallment: string | null;
  monthlyInstallmentEstimate: string | null;
  installmentYearsLabel: string | null;
  deliveryDateLabel: string | null;
  referenceCode: string | null;
  quickFacts: QuickFact[];
  specs: SpecItem[];
  trustItems: TrustItem[];
  purpose: string | null;
  buildingType: string | null;
  finishing: string | null;
  furnishing: string | null;
  phase: string | null;
  notes?: string | null;
  visibility: string | null;
  author: string | null;
}

// Component prop types
export interface UnitHeroGalleryProps {
  images: HeroImage[];
  isPrimary: boolean;
  canShare?: boolean;
  onShare?: () => void;
}

export interface UnitHeaderSummaryProps {
  unit: UnitViewModel;
}

export interface UnitQuickFactsProps {
  facts: QuickFact[];
}

export interface UnitPricingCardProps {
  unit: UnitViewModel;
}

export interface UnitPaymentPlanProps {
  unit: UnitViewModel;
}

export interface UnitSpecificationsProps {
  specs: SpecItem[];
}

export interface UnitLocationContextProps {
  unit: UnitViewModel;
}

export interface RelatedEntityLinksProps {
  unit: UnitViewModel;
}

export interface StickyInquiryCardProps {
  unit: UnitViewModel;
  rawUnit?: RawUnit;
  isOwnUnit?: boolean;
}

export interface MobileStickyActionBarProps {
  unit: UnitViewModel;
  isOwnUnit?: boolean;
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

export interface UnitDetailsSkeletonProps {
  // No props needed for skeleton
}

export interface UnitDetailsErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export interface UnitBreadcrumbsProps {
  unit: UnitViewModel;
}

export interface UnitBadgesProps {
  badges: string[];
}
