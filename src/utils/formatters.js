import CitiesAndDistrictsManager from "@/services/cities-districts-manager";

export function formatCityLabel(cityValue, locale = "en") {
  if (!cityValue) return "";
  const manager = CitiesAndDistrictsManager.getInstance();
  return manager.getCityLabel(cityValue, locale);
}

export function formatDistrictLabel(districtValue, cityValue, locale = "en") {
  if (!districtValue) return "";
  const manager = CitiesAndDistrictsManager.getInstance();
  return manager.getDistrictLabel(districtValue, cityValue, locale);
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
