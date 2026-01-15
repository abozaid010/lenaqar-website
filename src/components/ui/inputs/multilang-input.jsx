import FormInput from "@/components/ui/inputs/form-input";
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
      <div className="text-sm font-medium text-gray-700">
        <label>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      
      {/* Arabic Input */}
      <div>
        <FormInput
          type="text"
          name="ar_name"
          value={arValue}
          onChange={onChange}
          dir="rtl"
          className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder={
            placeholders.ar || (t && t.placeholders?.projectArName) || "اسم المشروع (العربية)"
          }
          required={required}
          error={errors.ar_name}
        />
      </div>

      {/* English Input */}
      <div>
        <FormInput
          type="text"
          name="en_name"
          value={enValue}
          onChange={onChange}
          dir="ltr"
          className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder={
            placeholders.en ||
            (t && t.placeholders?.projectEnName) ||
            "Compound Name (English)"
          }
          required={required}
          error={errors.en_name}
        />
      </div>
    </div>
  );
}
