import { LOCALIZED_CITIES, LOCALIZED_DISTRICTS } from "@/data/cities.js";

export function formatCityLabel(cityValue, locale = "en") {
  const city = LOCALIZED_CITIES.find((c) => c.value === cityValue);
  if (!city) return cityValue;
  return locale === "ar"
    ? city.ar_label || city.value
    : city.en_label || city.value;
}

export function formatDistrictLabel(districtValue, cityValue, locale = "en") {
  const district = LOCALIZED_DISTRICTS.find(
    (d) => d.value === districtValue && d.city === cityValue
  );
  if (!district) return districtValue;
  return locale === "ar"
    ? district.ar_label || district.value
    : district.en_label || district.value;
}

export const formatPrice = (num) => {
  if (num === "" || num === null || num === undefined) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
  return Number.parseInt(value).toLocaleString();
}
