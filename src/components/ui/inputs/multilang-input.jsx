import FormInput from "@/components/ui/inputs/form-input";
import { useI18n } from "@/context/translate-api";
import { useState } from "react";

export default function MultiLangInput({
  label,
  required,
  arValue,
  enValue,
  onChange,
  errors = {},
  placeholders = {},
}) {
  const [activeLang, setActiveLang] = useState("ar");
  const { t } = useI18n();

  return (
    <div>
      <div className="text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
        <label>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="inline-flex rounded bg-gray-100 border border-gray-300 overflow-hidden">
          <button
            type="button"
            className={`px-2 py-0.5 text-xs font-semibold ${
              activeLang === "ar"
                ? "bg-primary text-white border border-gray-300 rtl:rounded-r ltr:rounded-l"
                : "text-gray-700"
            }`}
            onClick={() => setActiveLang("ar")}
          >
            AR
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 text-xs font-semibold ${
              activeLang === "en"
                ? "bg-primary text-white border border-gray-300 rtl:rounded-l ltr:rounded-r"
                : "text-gray-700"
            }`}
            onClick={() => setActiveLang("en")}
          >
            EN
          </button>
        </div>
      </div>
      <FormInput
        type="text"
        name={activeLang === "ar" ? "ar_name" : "en_name"}
        value={activeLang === "ar" ? arValue : enValue}
        onChange={onChange}
        dir={activeLang === "ar" ? "rtl" : "ltr"}
        className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder={
          activeLang === "ar"
            ? placeholders.ar || (t && t.placeholders?.projectArName)
            : placeholders.en ||
              (t && t.placeholders?.projectEnName) ||
              "Compound Name (English)"
        }
        required={required}
        error={errors[activeLang === "ar" ? "ar_name" : "en_name"]}
      />
    </div>
  );
}
