import FormSelect from "@/components/ui/inputs/form-select";
import { useI18n } from "@/context/translate-api";
import { formatCityLabel } from "@/utils/formatters";

const STATIC_CITIES = [
  "alexandria",
  "aswan",
  "asyut",
  "beheira",
  "beni suef",
  "cairo",
  "dakahlia",
  "damietta",
  "faiyum",
  "gharbia",
  "giza",
  "ismailia",
  "kafr el sheikh",
  "luxor",
  "matrouh",
  "minya",
  "monufia",
  "new administrative capital",
  "new valley",
  "north coast",
  "north sinai",
  "port said",
  "qalyubia",
  "qena",
  "red sea",
  "sharqia",
  "sohag",
  "south sinai",
];

export default function CitySelect({ value, onChange, error, required }) {
  const { t, locale } = useI18n();
  return (
    <FormSelect
      label={t.basicDetails.city}
      name="city"
      value={value || ""}
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
