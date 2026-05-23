"use client";

import ImageUploader from "@/components/ui/inputs/image-uploader";
import { useI18n } from "@/hooks/useI18n";
import { LenaTextField, LenaTextarea } from "@/components/ui/inputs";

import FormSelect from "@/components/ui/inputs/form-select";
import { MAX_UNIT_IMAGES } from "./unit-form-constants";

export default function ImagesStep({
  formData,
  updateFormData,
  isUploading,
  setIsUploading,
  invalidFields = [],
  setInvalidFields = () => {},
  maxImages = MAX_UNIT_IMAGES,
}) {
  const { t, locale, translate } = useI18n();

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });

    if (invalidFields.includes(name)) {
      setInvalidFields((prev) => prev.filter((field) => field !== name));
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
        {/* Finishing Type */}
        <FormSelect
          label={t.finishingType}
          name="finishing"
          value={formData.finishing}
          onChange={handleChange}
          error={invalidFields.includes("finishing")}
          required
        >
          <option value="">{t.selectFinishingType}</option>
          <option value="fully finished">{t.fullyFinished}</option>
          <option value="semi finished">{t.semiFinished}</option>
          <option value="core & shell">{t.coreAndShell}</option>
        </FormSelect>

        {/* Furnishing Type - required only for rent */}
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              invalidFields.includes("furnishing")
                ? "text-red-500"
                : "text-gray-700"
            }`}
          >
            {t.furnishingType}
            {formData.purpose === "rent" && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <select
              name="furnishing"
              value={formData.furnishing}
              onChange={handleChange}
              className={`block w-full min-h-[40px] rounded-md border py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-1 appearance-none ${
                invalidFields.includes("furnishing")
                  ? "border-red-500 ring-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
            >
              <option value="">{t.furnishingType}</option>
              <option value="furnished">{t.furnished}</option>
              <option value="unfurnished">{t.unfurnished}</option>
            </select>
            <div
              className={`absolute inset-y-0 ${locale === "ar" ? "left-0" : "right-0"} flex items-center px-2 pointer-events-none`}
            >
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4 text-slate-800">
        {t.propertyImages}{" "}
        <span className="text-sm font-normal text-gray-500">
          {formData.images?.length || 0} / {maxImages}
        </span>
      </h3>

      <ImageUploader
        maxImages={maxImages}
        initialImages={formData.images || []}
        onImagesChange={(images) => updateFormData({ images })}
        isUploading={isUploading}
        setIsUploading={setIsUploading}
      />

      <div className="grid grid-cols-1 gap-3 mt-4">
        <LenaTextField
          label={translate(
            "unit.videoLink",
            locale === "ar" ? "رابط الفيديو (يوتيوب/فيسبوك)" : "Video Link (YouTube/Facebook)"
          )}
          name="video"
          type="url"
          value={formData.video || ""}
          onChange={handleChange}
          required={false}
        />

        <LenaTextarea
          label={translate("unit.notes", locale === "ar" ? "ملاحظات" : "Notes")}
          name="notes"
          value={formData.notes || ""}
          onChange={handleChange}
          required={false}
          rows={4}
        />
      </div>
    </>
  );
}
