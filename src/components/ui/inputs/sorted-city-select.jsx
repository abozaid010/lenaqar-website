import FormSelect from "@/components/ui/inputs/form-select";
import { useI18n } from "@/context/translate-api";
import { formatCityLabel } from "@/utils/formatters";

const STATIC_CITIES = [
  "Alexandria",
  "Aswan",
  "Asyut",
  "Beheira",
  "Beni Suef",
  "Cairo",
  "Dakahlia",
  "Damietta",
  "Faiyum",
  "Gharbia",
  "Giza",
  "Ismailia",
  "Kafr El Sheikh",
  "Luxor",
  "Matrouh",
  "Minya",
  "Monufia",
  "New Administrative Capital",
  "New Valley",
  "North Coast",
  "North Sinai",
  "Port Said",
  "Qalyubia",
  "Qena",
  "Red Sea",
  "Sharqia",
  "Sohag",
  "South Sinai",
  "Suez",
];

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
}

export default function CitySelect({ value, onChange, error, required }) {
  const { t, locale } = useI18n();
  return (
    <FormSelect
      label={t.basicDetails.city}
      name="city"
      value={toTitleCase(value) || ""}
      required={required}
      onChange={onChange}
      error={error}
    >
      <option value="">{t.basicDetails.selectCity}</option>
      {[...STATIC_CITIES]
        .sort((a, b) =>
          formatCityLabel(a, locale).localeCompare(formatCityLabel(b, locale))
        )
        .map((city, idx) => (
          <option key={idx} value={city}>
            {formatCityLabel(city, locale)}
          </option>
        ))}
    </FormSelect>
  );
}
