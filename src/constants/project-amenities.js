/**
 * Project amenities: canonical `value` (lowercase, stable for API) + display labels.
 * @typedef {{ value: string, en: string, ar: string }} ProjectAmenityDefinition
 */

/** @type {ProjectAmenityDefinition[]} */
export const PROJECT_AMENITY_ENUM = [
  { value: "gym", en: "Gym", ar: "صالة ألعاب رياضية" },
  { value: "private beach", en: "Private Beach", ar: "شاطئ خاص" },
  { value: "clubhouse", en: "Clubhouse", ar: "نادي اجتماعي" },
  { value: "swimming pool", en: "Swimming Pool", ar: "حمام سباحة" },
  { value: "parking", en: "Parking", ar: "موقف سيارات" },
  { value: "underground parking", en: "Underground Parking", ar: "موقف سيارات تحت الأرض" },
  { value: "security", en: "Security", ar: "أمن وحراسة" },
  { value: "garden", en: "Garden", ar: "حديقة" },
  { value: "kids area", en: "Kids Area", ar: "منطقة أطفال" },
  {
    value: "childrens play area",
    en: "Children's Play Area",
    ar: "منطقة لعب للأطفال",
  },
  { value: "spa", en: "Spa", ar: "سبا" },
  { value: "mosque", en: "Mosque", ar: "مسجد" },
  { value: "mall", en: "Mall", ar: "مول" },
  { value: "cinema", en: "Cinema", ar: "سينما" },
  { value: "elevator", en: "Elevator", ar: "مصعد" },
  { value: "backup power", en: "Backup Power", ar: "طاقة احتياطية" },
  { value: "concierge", en: "Concierge", ar: "خدمة كونسيرج" },
  { value: "jogging track", en: "Jogging Track", ar: "مضمار جري" },
  { value: "jogging trail", en: "Jogging Trail", ar: "مسار للجري" },
  { value: "sports court", en: "Sports Court", ar: "ملعب رياضي" },
  { value: "sports clubs", en: "Sports Clubs", ar: "نوادي رياضية" },
  { value: "coworking space", en: "Coworking Space", ar: "مساحة عمل مشتركة" },
  { value: "pet area", en: "Pet Area", ar: "منطقة للحيوانات الأليفة" },
  { value: "barbecue area", en: "Barbecue Area", ar: "منطقة شواء" },
  { value: "bicycles lanes", en: "Bicycles Lanes", ar: "مسارات دراجات" },
  { value: "shared gym", en: "Shared Gym", ar: "صالة رياضية مشتركة" },
  { value: "commercial strip", en: "Commercial Strip", ar: "شريط تجاري" },
  {
    value: "charging electric cars units",
    en: "Charging Electric Cars Units",
    ar: "وحدات شحن السيارات الكهربائية",
  },
  { value: "disability support", en: "Disability Support", ar: "دعم ذوي الإعاقة" },
  { value: "schools", en: "Schools", ar: "مدارس" },
  { value: "business hub", en: "Business Hub", ar: "مركز أعمال" },
  { value: "outdoor pools", en: "Outdoor Pools", ar: "مسابح خارجية" },
  { value: "medical center", en: "Medical Center", ar: "مركز طبي" },
];

/** Ordered list of canonical values (API / form `string[]`). */
export const DEFAULT_PROJECT_AMENITIES = PROJECT_AMENITY_ENUM.map((a) => a.value);

/** Map value -> { en, ar } for O(1) lookup */
export const PROJECT_AMENITY_LABELS = Object.fromEntries(
  PROJECT_AMENITY_ENUM.map((a) => [a.value, { en: a.en, ar: a.ar }])
);

/**
 * Legacy / duplicate spellings saved in older records → canonical `value`.
 * Keys must be normalized with the same rules as `normalizeAmenityKey`.
 */
export const AMENITY_VALUE_ALIASES = {
  "club house": "clubhouse",
  "bbq area": "barbecue area",
  "bbq": "barbecue area",
  "children's play area": "childrens play area",
  "childrens play area": "childrens play area",
};
