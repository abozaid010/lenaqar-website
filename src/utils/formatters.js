import CityManager from "./city_manager";

export async function formatCityLabel(cityValue, locale = "en") {
  if (!cityValue) return "";
  const manager = CityManager.getInstance();
  await manager.initializeData();
  return manager.getCityLabel(cityValue, locale);
}

export async function formatDistrictLabel(districtValue, cityValue, locale = "en") {
  if (!districtValue) return "";
  const manager = CityManager.getInstance();
  await manager.initializeData();
  return manager.getDistrictLabel(districtValue, cityValue, locale);
}

export async function formatSubDistrictLabel(
  subDistrictValue,
  cityValue,
  districtValue,
  locale = "en"
) {
  if (!subDistrictValue) return "";
  const manager = CityManager.getInstance();
  await manager.initializeData();
  return manager.getSubDistrictLabel(
    subDistrictValue,
    cityValue,
    districtValue,
    locale
  );
}

export async function formatLocationDisplay(
  { city = "", district = "", sub_district = "" } = {},
  locale = "en"
) {
  const manager = CityManager.getInstance();
  return manager.formatLocationDisplay({ city, district, sub_district }, locale);
}

export async function getLocationDisplayLabels(
  { city = "", district = "", sub_district = "" } = {},
  locale = "en"
) {
  const manager = CityManager.getInstance();
  return manager.getLocationDisplayLabels({ city, district, sub_district }, locale);
}

/**
 * Format a price for display: commas every 3 digits.
 * Accepts number or string (e.g. "2,3,2,3,1,2,3,123"); normalizes by stripping non-digits so display is correct.
 */
export const formatPrice = (num) => {
  if (num === "" || num === null || num === undefined) return "";
  const str =
    typeof num === "string"
      ? num.replace(/\D/g, "")
      : String(Math.floor(Number(num)));
  if (!str) return "";
  const n = parseInt(str, 10);
  if (isNaN(n)) return "";
  return n.toLocaleString("en-US");
};

export const convertArabicToEnglishNumbers = (input) => {
  if (typeof input !== "string") return input;
  const arabicToEnglish = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  return input.replace(/[٠-٩]/g, (d) => arabicToEnglish[d]);
};

export function formatCurrency(value) {
  if (!value) return "0";
  return Number.parseInt(value).toLocaleString('en-US');
}
