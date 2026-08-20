import lenaqar from "./lenaqar-ar.js";

/** Slim Arabic bundle for the public LenaQar site (no CRM namespaces). */
export default {
  lenaqar,
  common: {
    loading: "جاري التحميل...",
    saving: "جارٍ الحفظ...",
    cancel: "إلغاء",
    submit: "حفظ",
    all: "الكل",
    retry: "حاول تاني",
  },
  basicDetails: {
    city: "المدينة",
    district: "المنطقة",
    subDistrict: "الحي",
    compound: "المشروع",
    locationLoadFailed: "تعذّر تحميل المواقع. حاول تاني.",
  },
  unitsFilter: {
    allLocations: "كل المواقع",
    locationSearchPlaceholder: "ابحث عن مدينة أو منطقة أو حي…",
    locationSearchEmpty: "مفيش مواقع مطابقة",
  },
  unitFormValidation: {
    locationRequired: "يرجى اختيار موقع صالح.",
    locationSelectDistrict: "يرجى اختيار المنطقة.",
    locationSelectSubdistrict: "يرجى اختيار الحي الفرعي.",
    locationSelectDeepest: "يرجى اختيار أعمق مستوى متاح للموقع.",
  },
};
