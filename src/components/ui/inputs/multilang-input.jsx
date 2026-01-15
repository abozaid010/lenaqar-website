import { LenaTextField } from "@/components/ui/inputs";
import { useI18n } from "@/context/translate-api";

export default function MultiLangInput({
  label,
  required,
  arValue,
  enValue,
  onChange,
  errors = {},
  placeholders = {},
  missingLang,
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      {/* Arabic Input */}
      <div>
        <LenaTextField
          type="text"
          name="ar_name"
          label={t.formLabels?.projectArName || "Project Name (Arabic)"}
          value={arValue}
          onChange={onChange}
          dir="rtl"
          placeholder={placeholders.ar || (t && t.placeholders?.projectArName) || "اسم المشروع (العربية)"}
          required={required}
          error={errors.ar_name}
          errorMessage={errors.ar_name}
        />
      </div>

      {/* English Input */}
      <div>
        <LenaTextField
          type="text"
          name="en_name"
          label={t.formLabels?.projectEnName || "Project Name (English)"}
          value={enValue}
          onChange={onChange}
          dir="ltr"
          placeholder={placeholders.en || (t && t.placeholders?.projectEnName) || "Compound Name (English)"}
          required={required}
          error={errors.en_name}
          errorMessage={errors.en_name}
        />
      </div>
    </div>
  );
}
