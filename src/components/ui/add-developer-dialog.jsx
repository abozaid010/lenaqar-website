"use client";

import Dialog from "@/components/ui/Dialog";
import MultiLangInput from "@/components/ui/inputs/multilang-input";
import { useI18n } from "@/context/translate-api";
import { addDeveloper, updateDeveloper } from "@/utils/api";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
export default function AddDeveloperDialog({
  isOpen,
  onClose,
  onAdd,
  onEdit,
  client_id,
  developer,
}) {
  const isEdit = !!developer;

  const getClientId = () => {
    return client_id || LenaCookiesManager.getClientId() || "";
  };

  const [missingLang, setMissingLang] = useState(null);
  // Initialize with default values, will be updated by useEffect when developer prop changes
  const [formData, setFormData] = useState({
    id: uuidv4(),
    name: "",
    en_name: "",
    ar_name: "",
    description: "",
    ar_description: "",
    logo: "",
    website: "",
    sales_email: "",
    sales_phone: "",
    whatsapp: "",
    instagram: "",
    linkedin: "",
    facebook: "",
    founded_year: "",
    client_id: getClientId(),
  });

  useEffect(() => {
    if (developer) {
      // Merge developer data with default values to ensure all fields are present
      setFormData({
        id: developer.id || uuidv4(),
        name: developer.name || "",
        en_name: developer.en_name || "",
        ar_name: developer.ar_name || "",
        description: developer.description || "",
        ar_description: developer.ar_description || "",
        logo: developer.logo || "",
        website: developer.website || "",
        sales_email: developer.sales_email || "",
        sales_phone: developer.sales_phone || "",
        whatsapp: developer.whatsapp || "",
        instagram: developer.instagram || "",
        linkedin: developer.linkedin || "",
        facebook: developer.facebook || "",
        founded_year: developer.founded_year ? String(developer.founded_year) : "",
        client_id: developer.client_id || getClientId(),
      });
    } else {
      setFormData({
        id: uuidv4(),
        name: "",
        en_name: "",
        ar_name: "",
        description: "",
        ar_description: "",
        logo: "",
        website: "",
        sales_email: "",
        sales_phone: "",
        whatsapp: "",
        instagram: "",
        linkedin: "",
        facebook: "",
        founded_year: "",
        client_id: getClientId(),
      });
      setErrors({});
      setMissingLang(null);
    }
  }, [developer, isOpen]);

  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let hasMissingLang = false;

    // Mandatory fields validation
    if (!formData.ar_name?.trim()) {
      newErrors.ar_name = t.errors?.required || "Required";
      setMissingLang("ar");
      hasMissingLang = true;
    }

    if (!formData.en_name?.trim()) {
      newErrors.en_name = t.errors?.required || "Required";
      if (!hasMissingLang) {
        setMissingLang("en");
      }
    }

    if (!formData.description?.trim()) {
      newErrors.description = t.errors?.required || "Required";
    }

    if (!formData.ar_description?.trim()) {
      newErrors.ar_description = t.errors?.required || "Required";
    }

    if (!formData.sales_email?.trim()) {
      newErrors.sales_email = t.errors?.required || "Required";
    }

    if (!formData.sales_phone?.trim()) {
      newErrors.sales_phone = t.errors?.required || "Required";
    }

    if (!formData.whatsapp?.trim()) {
      newErrors.whatsapp = t.errors?.required || "Required";
    }

    if (!formData.founded_year?.trim()) {
      newErrors.founded_year = t.errors?.required || "Required";
    }

    // Email validation (mandatory field)
    if (formData.sales_email && formData.sales_email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.sales_email)) {
        newErrors.sales_email = t.errors?.invalidEmail || "Invalid email format";
      }
    }

    // Phone validation (mandatory field)
    if (formData.sales_phone && formData.sales_phone.trim() !== "") {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.sales_phone) || formData.sales_phone.trim().length < 10) {
        newErrors.sales_phone = t.errors?.invalidPhone || "Invalid phone number";
      }
    }

    // WhatsApp validation (mandatory field)
    if (formData.whatsapp && formData.whatsapp.trim() !== "") {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.whatsapp) || formData.whatsapp.trim().length < 10) {
        newErrors.whatsapp = t.errors?.invalidPhone || "Invalid WhatsApp number";
      }
    }

    // Optional social media URL validations
    const urlFields = ["website", "instagram", "linkedin", "facebook"];
    urlFields.forEach((field) => {
      if (formData[field] && formData[field].trim() !== "") {
        try {
          new URL(formData[field]);
        } catch {
          newErrors[field] = t.errors?.invalidUrl || "Invalid URL format";
        }
      }
    });

    // Year validation (mandatory field)
    if (formData.founded_year && formData.founded_year !== "") {
      const year = parseInt(formData.founded_year);
      if (isNaN(year) || year < 1800 || year > 2100) {
        newErrors.founded_year = t.errors?.invalidYear || "Year must be between 1800 and 2100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      const submittedData = {
        ...formData,
        name: formData.en_name,
      };
      if (isEdit) {
        res = await updateDeveloper(submittedData, developer.id);
      } else {
        res = await addDeveloper(submittedData);
      }
      if (res.code === 200) {
        toast.success(
          isEdit
            ? "Developer updated successfully!"
            : "Developer added successfully!"
        );
        if (isEdit) {
          onEdit && onEdit(res.data);
        } else {
          onAdd && onAdd(res.data);
        }
        onClose();
      } else {
        toast.error("Failed to save developer. Please try again.");
      }
    } catch (error) {
      setErrors({ submit: "Failed to save developer. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      closeOnOutsideClick={false}
      closeOnEscape={false}
      showCloseButton={false}
      headerLeading={
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-md border border-white/30 bg-white/10 text-white hover:bg-white/15 text-sm disabled:opacity-70 disabled:pointer-events-none"
          disabled={isSubmitting}
        >
          {t.cancel}
        </button>
      }
      headerActions={
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-3 py-1.5 rounded-md bg-white text-primary hover:bg-white/90 text-sm disabled:opacity-70 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {t.saving}
            </span>
          ) : isEdit ? (
            t.saveChangesButton
          ) : (
            t.saveDeveloper
          )}
        </button>
      }
      title={
        isEdit ? t.developerPage.editDeveloper : t.developerPage.addDeveloper
      }
    >
      <div className="space-y-4">
        {/* Basic Information */}
        <div className="space-y-2">
          <MultiLangInput
            label={t.DeveloperName}
            required
            arValue={formData.ar_name}
            enValue={formData.en_name}
            onChange={handleChange}
            placeholders={{
              ar: t.placeholders?.developerArName || "اسم المطور (العربية)",
              en: t.placeholders?.developerEnName || "Developer Name (English)",
            }}
            errors={{
              ar_name: errors.ar_name,
              en_name: errors.en_name,
            }}
            missingLang={missingLang}
          />
        </div>

        {/* Descriptions */}
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.description || "Description"} ({t.common?.english || "English"}) *
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={4}
              className={`block w-full rounded-md border py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t.placeholders?.description || "Enter description in English"}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.description || "Description"} ({t.common?.arabic || "Arabic"}) *
            </label>
            <textarea
              name="ar_description"
              value={formData.ar_description || ""}
              onChange={handleChange}
              rows={4}
              dir="rtl"
              className={`block w-full rounded-md border py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.ar_description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t.placeholders?.arDescription || "أدخل الوصف بالعربية"}
            />
            {errors.ar_description && (
              <p className="text-xs text-red-500 mt-1">{errors.ar_description}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.salesEmail || "Sales Email"} *
            </label>
            <input
              type="email"
              name="sales_email"
              value={formData.sales_email || ""}
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.sales_email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t.placeholders?.email || "example@email.com"}
            />
            {errors.sales_email && (
              <p className="text-xs text-red-500 mt-1">{errors.sales_email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.salesPhone || "Sales Phone"} *
            </label>
            <input
              type="tel"
              name="sales_phone"
              value={formData.sales_phone || ""}
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.sales_phone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t.placeholders?.phone || "Phone number"}
            />
            {errors.sales_phone && (
              <p className="text-xs text-red-500 mt-1">{errors.sales_phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp *
            </label>
            <input
              type="text"
              name="whatsapp"
              value={formData.whatsapp || ""}
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.whatsapp ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t.placeholders?.whatsapp || "WhatsApp number"}
            />
            {errors.whatsapp && (
              <p className="text-xs text-red-500 mt-1">{errors.whatsapp}</p>
            )}
          </div>
        </div>

        {/* Social Media & Web */}
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.website || "Website"}
            </label>
            <input
              type="url"
              name="website"
              value={formData.website || ""}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com"
            />
            {errors.website && (
              <p className="text-xs text-red-500 mt-1">{errors.website}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instagram
            </label>
            <input
              type="url"
              name="instagram"
              value={formData.instagram || ""}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://instagram.com/username"
            />
            {errors.instagram && (
              <p className="text-xs text-red-500 mt-1">{errors.instagram}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn
            </label>
            <input
              type="url"
              name="linkedin"
              value={formData.linkedin || ""}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://linkedin.com/company/name"
            />
            {errors.linkedin && (
              <p className="text-xs text-red-500 mt-1">{errors.linkedin}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facebook
            </label>
            <input
              type="url"
              name="facebook"
              value={formData.facebook || ""}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://facebook.com/username"
            />
            {errors.facebook && (
              <p className="text-xs text-red-500 mt-1">{errors.facebook}</p>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.foundedYear || "Founded Year"} *
            </label>
            <input
              type="number"
              name="founded_year"
              value={formData.founded_year || ""}
              onChange={handleChange}
              min="1800"
              max="2100"
              className={`block w-full rounded-md border py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.founded_year ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., 2015"
            />
            {errors.founded_year && (
              <p className="text-xs text-red-500 mt-1">{errors.founded_year}</p>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
