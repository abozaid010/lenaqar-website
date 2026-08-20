import lenaqar from "./lenaqar-en.js";

/** Slim English bundle for the public LenaQar site (no CRM namespaces). */
export default {
  lenaqar,
  common: {
    loading: "Loading...",
    saving: "Saving...",
    cancel: "Cancel",
    submit: "Save",
    all: "All",
    retry: "Retry",
  },
  basicDetails: {
    city: "City",
    district: "District",
    subDistrict: "Sub-district",
    compound: "Project",
    locationLoadFailed: "Couldn't load locations. Try again.",
  },
  unitsFilter: {
    allLocations: "All locations",
    locationSearchPlaceholder: "Search city, district, or area…",
    locationSearchEmpty: "No matching locations",
  },
  unitFormValidation: {
    locationRequired: "Please select a valid location.",
    locationSelectDistrict: "Please select a district.",
    locationSelectSubdistrict: "Please select a subdistrict.",
    locationSelectDeepest: "Please select the deepest available location.",
  },
};
