"use client";

import UnifiedDialog from "@/components/ui/UnifiedDialog";
import MultiLangInput from "@/components/ui/inputs/multilang-input";
import { LenaTextField, LenaTextarea } from "@/components/ui/inputs";
import { useI18n } from "@/hooks/useI18n";
import { addDeveloper, updateDeveloper, getClientid } from "@/utils/api";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import {
  Pencil,
  Globe,
  Mail,
  Phone,
  Calendar,
  Instagram,
  Linkedin,
  Facebook,
} from "lucide-react";
import ImageWithLoader from "@/components/ui/image-with-loader";
import { getRoleFromToken } from "@/lib/getRoleFromToken.client";
import { useBrokerPermission } from "@/hooks/useBrokerPermission";

export default function AddDeveloperDialog({
  isOpen,
  onClose,
  onAdd,
  onEdit,
  client_id,
  developer,
  initialEditMode = false,
}) {
  const isEdit = !!developer;
  const [isEditing, setIsEditing] = useState(false);
  const roleFromToken = getRoleFromToken();
  const effectiveIsAdmin = roleFromToken === "admin" || roleFromToken === "owner";
  const { canModify } = useBrokerPermission();
  const canEditThisDeveloper = canModify(developer);

  const getClientId = () => {
    return getClientid() || client_id || LenaCookiesManager.getClientId() || "";
  };

  const [missingLang, setMissingLang] = useState(null);
  const [formData, setFormData] = useState({
    id: uuidv4(),
    name: "",
    en_name: "",
    ar_name: "",
    description: "",
    ar_description: "",
    logo: "",
    website: "",
    sales_name: "",
    sales_phone: "",
    whatsapp: "",
    instagram: "",
    linkedin: "",
    facebook: "",
    founded_year: "",
    client_id: getClientId(),
    profile_reviews: {
      financial_state: { ar: "", en: "" },
      developer_reputation: { ar: "", en: "" },
      legal_compliance_clients: { ar: "", en: "" },
      in_progress_projects: [],
      delivered_projects: [],
      financial_state_rate: null,
      developer_reputation_rate: null,
      delivery_on_time_score: null,
      legal_compliance_score: null,
      maintenance_after_delivery_rate: null,
      sources: []
    }
  });

  // Profile Reviews are only relevant for the shared public developer directory.
  // Derived after formData is declared so it re-evaluates correctly on state changes.
  const isPublicDeveloper = formData.client_id === "public";

  useEffect(() => {
    if (developer) {
      // Existing developer - start in view mode
      setFormData({
        id: developer.id || uuidv4(),
        name: developer.name || "",
        en_name: developer.en_name || "",
        ar_name: developer.ar_name || "",
        description: developer.description || "",
        ar_description: developer.ar_description || "",
        logo: developer.logo || "",
        website: developer.website || "",
        sales_name: developer.sales_name || "",
        sales_phone: developer.sales_phone || "",
        whatsapp: developer.whatsapp || "",
        instagram: developer.instagram || "",
        linkedin: developer.linkedin || "",
        facebook: developer.facebook || "",
        founded_year: developer.founded_year
          ? String(developer.founded_year)
          : "",
        client_id: developer.client_id || getClientId(),
        profile_reviews: developer.profile_reviews || {
          financial_state: { ar: "", en: "" },
          developer_reputation: { ar: "", en: "" },
          legal_compliance_clients: { ar: "", en: "" },
          in_progress_projects: [],
          delivered_projects: [],
          financial_state_rate: null,
          developer_reputation_rate: null,
          delivery_on_time_score: null,
          legal_compliance_score: null,
          maintenance_after_delivery_rate: null,
          sources: []
        }
      });
      setIsEditing(initialEditMode); // start in edit mode if triggered from Edit button
      const pr = developer.profile_reviews || {};
      setInProgressRaw((pr.in_progress_projects || []).join(', '));
      setDeliveredRaw((pr.delivered_projects || []).join(', '));
      originalProfileReviewsRef.current = JSON.stringify(pr);
    } else {
      // New developer - start in edit mode
      setFormData({
        id: uuidv4(),
        name: "",
        en_name: "",
        ar_name: "",
        description: "",
        ar_description: "",
        logo: "",
        website: "",
        sales_name: "",
        sales_phone: "",
        whatsapp: "",
        instagram: "",
        linkedin: "",
        facebook: "",
        founded_year: "",
        client_id: getClientId(),
        profile_reviews: {
          financial_state: { ar: "", en: "" },
          developer_reputation: { ar: "", en: "" },
          legal_compliance_clients: { ar: "", en: "" },
          in_progress_projects: [],
          delivered_projects: [],
          financial_state_rate: null,
          developer_reputation_rate: null,
          delivery_on_time_score: null,
          legal_compliance_score: null,
          maintenance_after_delivery_rate: null,
          sources: []
        }
      });
      setErrors({});
      setMissingLang(null);
      setIsEditing(true); // Start in edit mode for new developers
      setInProgressRaw('');
      setDeliveredRaw('');
      originalProfileReviewsRef.current = null;
    }
  }, [developer, isOpen]);

  const { t, locale } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [inProgressRaw, setInProgressRaw] = useState('');
  const [deliveredRaw, setDeliveredRaw] = useState('');
  const originalProfileReviewsRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested profile_reviews fields
    if (name.startsWith('profile_reviews.')) {
      const [_, field] = name.split('.');
      setFormData({
        ...formData,
        profile_reviews: {
          ...formData.profile_reviews,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

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

    if (!formData.sales_name?.trim()) {
      newErrors.sales_name = t.errors?.required || "Required";
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

    if (formData.sales_phone && formData.sales_phone.trim() !== "") {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (
        !phoneRegex.test(formData.sales_phone) ||
        formData.sales_phone.trim().length < 10
      ) {
        newErrors.sales_phone =
          t.errors?.invalidPhone || "Invalid phone number";
      }
    }

    if (formData.whatsapp && formData.whatsapp.trim() !== "") {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (
        !phoneRegex.test(formData.whatsapp) ||
        formData.whatsapp.trim().length < 10
      ) {
        newErrors.whatsapp =
          t.errors?.invalidPhone || "Invalid WhatsApp number";
      }
    }

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

    if (formData.founded_year && formData.founded_year !== "") {
      const year = parseInt(formData.founded_year);
      if (isNaN(year) || year < 1800 || year > 2100) {
        newErrors.founded_year =
          t.errors?.invalidYear || "Year must be between 1800 and 2100";
      }
    }

    // Validate comma-separated format for project fields
    const badCommaSep = /,\s*,|^,|,\s*$/;
    if (inProgressRaw.trim() && badCommaSep.test(inProgressRaw.trim())) {
      newErrors['profile_reviews.in_progress_projects'] = 'Invalid format: use comma-separated values (e.g., Project A, Project B)';
    }
    if (deliveredRaw.trim() && badCommaSep.test(deliveredRaw.trim())) {
      newErrors['profile_reviews.delivered_projects'] = 'Invalid format: use comma-separated values (e.g., Project A, Project B)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      let res;

      const tokenClientId = getClientid();
      const finalClientId = isEdit
        ? formData.client_id
        : tokenClientId || formData.client_id || client_id;

      const parsedInProgress = inProgressRaw.split(',').map(p => p.trim()).filter(Boolean);
      const parsedDelivered = deliveredRaw.split(',').map(p => p.trim()).filter(Boolean);
      const updatedProfileReviews = {
        ...formData.profile_reviews,
        in_progress_projects: parsedInProgress,
        delivered_projects: parsedDelivered,
      };
      const profileReviewsChanged = isEdit &&
        originalProfileReviewsRef.current !== null &&
        JSON.stringify(updatedProfileReviews) !== originalProfileReviewsRef.current;
      const finalProfileReviews = {
        ...updatedProfileReviews,
        ...(profileReviewsChanged ? { reviewed_by_human: true } : {}),
      };

      const { profile_reviews, ...formDataWithoutReviews } = formData;
      const submittedData = {
        ...(finalClientId === "public" ? { ...formData, profile_reviews: finalProfileReviews } : formDataWithoutReviews),
        client_id: finalClientId,
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
          setIsEditing(false);
        } else {
          onAdd && onAdd(res.data);
          onClose();
        }
      } else {
        toast.error("Failed to save developer. Please try again.");
      }
    } catch (error) {
      setErrors({ submit: "Failed to save developer. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === "") return;
    const raw = String(phoneNumber).trim();
    const lower = raw.toLowerCase();
    if (lower.startsWith("http://") || lower.startsWith("https://")) {
      window.open(raw, "_blank", "noopener,noreferrer");
      return;
    }
    if (lower.startsWith("wa.me/") || lower.startsWith("www.wa.me/")) {
      window.open(`https://${raw}`, "_blank", "noopener,noreferrer");
      return;
    }
    if (lower.startsWith("www.")) {
      window.open(`https://${raw}`, "_blank", "noopener,noreferrer");
      return;
    }
    let cleaned = raw.replace(/[\s\-\(\)\.]/g, "");
    if (cleaned.startsWith("00")) cleaned = cleaned.slice(2);
    if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
    const digitsOnly = cleaned.replace(/\D/g, "");
    if (digitsOnly) {
      window.open(
        `https://wa.me/${digitsOnly}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === "") return;
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleEmail = (email) => {
    if (!email || email.trim() === "") return;
    window.location.href = `mailto:${email}`;
  };

  const handleWebsite = (url) => {
    if (!url || url.trim() === "") return;
    const urlToOpen = url.startsWith("http") ? url : `https://${url}`;
    window.open(urlToOpen, "_blank", "noopener,noreferrer");
  };

  const handleSocialLink = (url) => {
    if (!url || url.trim() === "") return;
    const urlToOpen = url.startsWith("http") ? url : `https://${url}`;
    window.open(urlToOpen, "_blank", "noopener,noreferrer");
  };

  const ViewMode = () => {
    const { locale } = useI18n();
    return (
      <div className="space-y-6">
        {formData.logo && (
          <div className="flex justify-center">
            <div className="w-40 h-40 relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <ImageWithLoader
                src={formData.logo}
                alt={locale === "ar" ? formData.ar_name : formData.en_name}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="text-lg font-semibold text-primary border-b pb-2">
            {locale === "ar" ? formData.ar_name : formData.en_name}
          </h3>

          {locale === "ar" && formData.ar_name && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Name (EN):</span> {formData.en_name}
            </p>
          )}
          {locale === "en" && formData.ar_name && (
            <p className="text-sm text-gray-600" dir="rtl">
              <span className="font-medium">Name (AR):</span> {formData.ar_name}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {locale === "en" && formData.ar_description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4
                className="text-sm font-semibold text-gray-700 mb-2"
                dir="rtl"
              >
                {t.formLabels?.description || "Description"} (
                {t.common?.arabic || "Arabic"})
              </h4>
              <p
                className="text-sm text-gray-700 whitespace-pre-line"
                dir="rtl"
              >
                {formData.ar_description}
              </p>
            </div>
          )}

          {locale === "ar" && formData.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {t.formLabels?.description || "Description"} (
                {t.common?.english || "English"})
              </h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {formData.description}
              </p>
            </div>
          )}

          {locale === "ar" &&
            formData.ar_description &&
            formData.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  {t.formLabels?.description || "Description"} (
                  {t.common?.english || "English"})
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {formData.description}
                </p>
              </div>
            )}

          {locale === "en" &&
            !formData.ar_description &&
            formData.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  {t.formLabels?.description || "Description"}
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {formData.description}
                </p>
              </div>
            )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">
            {t.formLabels?.contactInfo || "Contact Information"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {formData.sales_name && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border text-left">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">
                    {t.formLabels?.salesName || "Sales Name"}
                  </p>
                  <p className="text-sm text-gray-900 truncate">
                    {formData.sales_name}
                  </p>
                </div>
              </div>
            )}

            {formData.sales_phone && (
              <button
                onClick={() => handleCall(formData.sales_phone)}
                className="flex items-center gap-2 p-2 bg-white rounded-lg border hover:bg-gray-100 transition-colors text-left"
              >
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone size={14} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">
                    {t.formLabels?.salesPhone || "Phone"}
                  </p>
                  <p className="text-sm text-gray-900 truncate">
                    {formData.sales_phone}
                  </p>
                </div>
              </button>
            )}

            {formData.whatsapp && (
              <button
                onClick={() => handleWhatsApp(formData.whatsapp)}
                className="flex items-center gap-2 p-2 bg-white rounded-lg border hover:bg-gray-100 transition-colors text-left"
              >
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">WhatsApp</p>
                  <p className="text-sm text-gray-900 truncate">
                    {formData.whatsapp}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">
            {t.formLabels?.socialLinks || "Social Links & Website"}
          </h4>

          <div className="flex flex-wrap gap-2">
            {formData.website && (
              <button
                onClick={() => handleWebsite(formData.website)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border hover:bg-gray-100 transition-colors"
              >
                <Globe size={16} className="text-gray-600" />
                <span className="text-sm text-gray-700">Website</span>
              </button>
            )}

            {formData.instagram && (
              <button
                onClick={() => handleSocialLink(formData.instagram)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border hover:bg-gray-100 transition-colors"
              >
                <Instagram size={16} className="text-pink-500" />
                <span className="text-sm text-gray-700">Instagram</span>
              </button>
            )}

            {formData.linkedin && (
              <button
                onClick={() => handleSocialLink(formData.linkedin)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border hover:bg-gray-100 transition-colors"
              >
                <Linkedin size={16} className="text-blue-700" />
                <span className="text-sm text-gray-700">LinkedIn</span>
              </button>
            )}

            {formData.facebook && (
              <button
                onClick={() => handleSocialLink(formData.facebook)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border hover:bg-gray-100 transition-colors"
              >
                <Facebook size={16} className="text-blue-600" />
                <span className="text-sm text-gray-700">Facebook</span>
              </button>
            )}
          </div>
        </div>

        {formData.founded_year && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-500" />
              <span className="text-sm text-gray-700">
                <span className="font-medium">
                  {t.formLabels?.foundedYear || "Founded Year"}:
                </span>{" "}
                {formData.founded_year}
              </span>
            </div>
          </div>
        )}

        {/* Profile Reviews Section - Public developers only */}
        {isPublicDeveloper && formData.profile_reviews && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="text-lg font-semibold text-primary border-b pb-2 mb-4">
              {t.developerPage?.profileReviews || "Profile Reviews"}
            </h4>

            {/* Scores */}
            {(formData.profile_reviews.financial_state_rate !== null ||
              formData.profile_reviews.developer_reputation_rate !== null ||
              formData.profile_reviews.delivery_on_time_score !== null ||
              formData.profile_reviews.legal_compliance_score !== null ||
              formData.profile_reviews.maintenance_after_delivery_rate !== null) && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {formData.profile_reviews.financial_state_rate !== null && (
                  <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-2xl font-bold text-primary">
                      {formData.profile_reviews.financial_state_rate}/10
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {t.formLabels?.financialStateRate || "Financial State"}
                    </div>
                  </div>
                )}
                {formData.profile_reviews.developer_reputation_rate !== null && (
                  <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-2xl font-bold text-primary">
                      {formData.profile_reviews.developer_reputation_rate}/10
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {t.formLabels?.reputationRate || "Reputation"}
                    </div>
                  </div>
                )}
                {formData.profile_reviews.delivery_on_time_score !== null && (
                  <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-2xl font-bold text-primary">
                      {formData.profile_reviews.delivery_on_time_score}/10
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {t.formLabels?.deliveryOnTime || "Delivery On Time"}
                    </div>
                  </div>
                )}
                {formData.profile_reviews.legal_compliance_score !== null && (
                  <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-2xl font-bold text-primary">
                      {formData.profile_reviews.legal_compliance_score}/10
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {t.formLabels?.legalComplianceScore || "Legal Compliance"}
                    </div>
                  </div>
                )}
                {formData.profile_reviews.maintenance_after_delivery_rate !== null && (
                  <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-2xl font-bold text-primary">
                      {formData.profile_reviews.maintenance_after_delivery_rate}/10
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {t.formLabels?.maintenanceRate || "Maintenance"}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Financial State */}
            {(formData.profile_reviews.financial_state?.en || formData.profile_reviews.financial_state?.ar) && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">
                  {t.formLabels?.financialState || "Financial State"}
                </h5>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {locale === "ar" && formData.profile_reviews.financial_state?.ar ? (
                    <div dir="rtl">{formData.profile_reviews.financial_state.ar}</div>
                  ) : (
                    formData.profile_reviews.financial_state.en
                  )}
                </div>
              </div>
            )}

            {/* Developer Reputation */}
            {(formData.profile_reviews.developer_reputation?.en || formData.profile_reviews.developer_reputation?.ar) && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">
                  {t.formLabels?.developerReputation || "Developer Reputation"}
                </h5>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {locale === "ar" && formData.profile_reviews.developer_reputation?.ar ? (
                    <div dir="rtl">{formData.profile_reviews.developer_reputation.ar}</div>
                  ) : (
                    formData.profile_reviews.developer_reputation.en
                  )}
                </div>
              </div>
            )}

            {/* Legal Compliance */}
            {(formData.profile_reviews.legal_compliance_clients?.en || formData.profile_reviews.legal_compliance_clients?.ar) && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">
                  {t.formLabels?.legalCompliance || "Legal Compliance"}
                </h5>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {locale === "ar" && formData.profile_reviews.legal_compliance_clients?.ar ? (
                    <div dir="rtl">{formData.profile_reviews.legal_compliance_clients.ar}</div>
                  ) : (
                    formData.profile_reviews.legal_compliance_clients.en
                  )}
                </div>
              </div>
            )}

            {/* Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.profile_reviews.in_progress_projects && formData.profile_reviews.in_progress_projects.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">
                    {t.formLabels?.inProgressProjects || "In Progress Projects"}
                  </h5>
                  <p className="text-sm text-gray-700">
                    {formData.profile_reviews.in_progress_projects.join(', ')}
                  </p>
                </div>
              )}

              {formData.profile_reviews.delivered_projects && formData.profile_reviews.delivered_projects.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">
                    {t.formLabels?.deliveredProjects || "Delivered Projects"}
                  </h5>
                  <p className="text-sm text-gray-700">
                    {formData.profile_reviews.delivered_projects.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Sources */}
            {formData.profile_reviews.sources && formData.profile_reviews.sources.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <h5 className="text-sm font-semibold text-gray-700 mb-2">
                  {t.formLabels?.sources || "Sources"}
                </h5>
                <ul className="text-sm space-y-1">
                  {formData.profile_reviews.sources.map((source, index) => (
                    <li key={index}>
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const EditMode = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL
            </label>
            <input
              type="url"
              name="logo"
              value={formData.logo || ""}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>

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

        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.description || "Description"} (
              {t.common?.english || "English"}) *
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={4}
              className={`block w-full rounded-md border py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={
                t.placeholders?.description || "Enter description in English"
              }
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.description || "Description"} (
              {t.common?.arabic || "Arabic"}) *
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
              placeholder={
                t.placeholders?.arDescription || "أدخل الوصف بالعربية"
              }
            />
            {errors.ar_description && (
              <p className="text-xs text-red-500 mt-1">
                {errors.ar_description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.salesName || "Sales Name"} *
            </label>
            <input
              type="text"
              name="sales_name"
              value={formData.sales_name || ""}
              onChange={handleChange}
              className={`block w-full rounded-md border py-1 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.sales_name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={t.placeholders?.salesName || "Sales representative name"}
            />
            {errors.sales_name && (
              <p className="text-xs text-red-500 mt-1">{errors.sales_name}</p>
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

        {/* Profile Reviews Section - Public developers only */}
        {isPublicDeveloper && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-lg font-semibold text-primary border-b pb-2 mb-4">
            {t.developerPage?.profileReviews || "Profile Reviews"}
          </h4>

          {/* Financial State */}
          <div className="space-y-2">
            <LenaTextarea
              label={`${t.formLabels?.financialState || "Financial State"} (EN)`}
              name="profile_reviews.financial_state.en"
              value={formData.profile_reviews?.financial_state?.en || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  profile_reviews: {
                    ...formData.profile_reviews,
                    financial_state: {
                      ...formData.profile_reviews.financial_state,
                      en: e.target.value
                    }
                  }
                });
              }}
              rows={4}
              placeholder="Enter financial state in English"
            />
            <LenaTextarea
              label={`${t.formLabels?.financialState || "Financial State"} (AR)`}
              name="profile_reviews.financial_state.ar"
              value={formData.profile_reviews?.financial_state?.ar || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  profile_reviews: {
                    ...formData.profile_reviews,
                    financial_state: {
                      ...formData.profile_reviews.financial_state,
                      ar: e.target.value
                    }
                  }
                });
              }}
              rows={4}
              dir="rtl"
              placeholder="أدخل الحالة المالية بالعربية"
            />
          </div>

          {/* Developer Reputation */}
          <div className="space-y-2">
            <LenaTextarea
              label={`${t.formLabels?.developerReputation || "Developer Reputation"} (EN)`}
              name="profile_reviews.developer_reputation.en"
              value={formData.profile_reviews?.developer_reputation?.en || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  profile_reviews: {
                    ...formData.profile_reviews,
                    developer_reputation: {
                      ...formData.profile_reviews.developer_reputation,
                      en: e.target.value
                    }
                  }
                });
              }}
              rows={4}
              placeholder="Enter developer reputation in English"
            />
            <LenaTextarea
              label={`${t.formLabels?.developerReputation || "Developer Reputation"} (AR)`}
              name="profile_reviews.developer_reputation.ar"
              value={formData.profile_reviews?.developer_reputation?.ar || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  profile_reviews: {
                    ...formData.profile_reviews,
                    developer_reputation: {
                      ...formData.profile_reviews.developer_reputation,
                      ar: e.target.value
                    }
                  }
                });
              }}
              rows={4}
              dir="rtl"
              placeholder="أدخل سمعة المطور بالعربية"
            />
          </div>

          {/* Legal Compliance */}
          <div className="space-y-2">
            <LenaTextarea
              label={`${t.formLabels?.legalCompliance || "Legal Compliance"} (EN)`}
              name="profile_reviews.legal_compliance_clients.en"
              value={formData.profile_reviews?.legal_compliance_clients?.en || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  profile_reviews: {
                    ...formData.profile_reviews,
                    legal_compliance_clients: {
                      ...formData.profile_reviews.legal_compliance_clients,
                      en: e.target.value
                    }
                  }
                });
              }}
              rows={4}
              placeholder="Enter legal compliance information in English"
            />
            <LenaTextarea
              label={`${t.formLabels?.legalCompliance || "Legal Compliance"} (AR)`}
              name="profile_reviews.legal_compliance_clients.ar"
              value={formData.profile_reviews?.legal_compliance_clients?.ar || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  profile_reviews: {
                    ...formData.profile_reviews,
                    legal_compliance_clients: {
                      ...formData.profile_reviews.legal_compliance_clients,
                      ar: e.target.value
                    }
                  }
                });
              }}
              rows={4}
              dir="rtl"
              placeholder="أدخل معلومات الامتثال القانوني بالعربية"
            />
          </div>

          {/* Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <LenaTextarea
                label={t.formLabels?.inProgressProjects || "In Progress Projects"}
                name="profile_reviews.in_progress_projects"
                value={inProgressRaw}
                onChange={(e) => {
                  const raw = e.target.value;
                  setInProgressRaw(raw);
                  setFormData({
                    ...formData,
                    profile_reviews: {
                      ...formData.profile_reviews,
                      in_progress_projects: raw.split(',').map(p => p.trim()).filter(Boolean)
                    }
                  });
                }}
                rows={4}
                error={errors['profile_reviews.in_progress_projects']}
                placeholder="Enter in-progress projects (comma-separated, e.g., Project A, Project B)"
              />
            </div>
            <div>
              <LenaTextarea
                label={t?.formLabels?.deliveredProjects}
                name="profile_reviews.delivered_projects"
                value={deliveredRaw}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDeliveredRaw(raw);
                  setFormData({
                    ...formData,
                    profile_reviews: {
                      ...formData.profile_reviews,
                      delivered_projects: raw.split(',').map(p => p.trim()).filter(Boolean)
                    }
                  });
                }}
                rows={4}
                error={errors['profile_reviews.delivered_projects']}
                placeholder="Enter delivered projects (comma-separated, e.g., Project A, Project B)"
              />
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <LenaTextField
              label={`${t.formLabels?.financialStateRate || "Financial State Rate"} (0-10)`}
              type="number"
              name="profile_reviews.financial_state_rate"
              value={formData.profile_reviews?.financial_state_rate || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  profile_reviews: {
                    ...formData.profile_reviews,
                    financial_state_rate: e.target.value ? parseInt(e.target.value) : null
                  }
                });
              }}
              min="0"
              max="10"
              placeholder="0-10"
            />
            <LenaTextField
              label={`${t.formLabels?.reputationRate || "Reputation Rate"} (0-10)`}
              type="number"
              name="profile_reviews.developer_reputation_rate"
              value={formData.profile_reviews?.developer_reputation_rate || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  profile_reviews: {
                    ...formData.profile_reviews,
                    developer_reputation_rate: e.target.value ? parseInt(e.target.value) : null
                  }
                });
              }}
              min="0"
              max="10"
              placeholder="0-10"
            />
            <LenaTextField
              label={`${t.formLabels?.deliveryOnTimeScore || "Delivery On Time Score"} (0-10)`}
              type="number"
              name="profile_reviews.delivery_on_time_score"
              value={formData.profile_reviews?.delivery_on_time_score || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  profile_reviews: {
                    ...formData.profile_reviews,
                    delivery_on_time_score: e.target.value ? parseInt(e.target.value) : null
                  }
                });
              }}
              min="0"
              max="10"
              placeholder="0-10"
            />
            <LenaTextField
              label={`${t.formLabels?.legalComplianceScore || "Legal Compliance Score"} (0-10)`}
              type="number"
              name="profile_reviews.legal_compliance_score"
              value={formData.profile_reviews?.legal_compliance_score || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  profile_reviews: {
                    ...formData.profile_reviews,
                    legal_compliance_score: e.target.value ? parseInt(e.target.value) : null
                  }
                });
              }}
              min="0"
              max="10"
              placeholder="0-10"
            />
            <LenaTextField
              label={`${t.formLabels?.maintenanceRate || "Maintenance After Delivery Rate"} (0-10)`}
              type="number"
              name="profile_reviews.maintenance_after_delivery_rate"
              value={formData.profile_reviews?.maintenance_after_delivery_rate || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  profile_reviews: {
                    ...formData.profile_reviews,
                    maintenance_after_delivery_rate: e.target.value ? parseFloat(e.target.value) : null
                  }
                });
              }}
              min="0"
              max="10"
              step="0.1"
              placeholder="0-10"
            />
          </div>

          {/* Sources */}
          <div>
            <LenaTextarea
              label={`${t.formLabels?.sources || "Sources"} (one URL per line)`}
              name="profile_reviews.sources"
              value={formData.profile_reviews?.sources?.join('\n') || ""}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  profile_reviews: {
                    ...formData.profile_reviews,
                    sources: e.target.value.split('\n').filter(s => s.trim())
                  }
                });
              }}
              rows={5}
              placeholder={"https://example.com/source1\nhttps://example.com/source2"}
            />
          </div>
        </div>
      )}
      </div>
    );
  };

  const handleCancel = () => {
    if (isEdit && isEditing) {
      setIsEditing(false);
    } else {
      onClose();
    }
  };

  // Edit button for header when in view mode
  const HeaderEditButton = () => (
    <button
      type="button"
      onClick={canEditThisDeveloper ? () => setIsEditing(true) : undefined}
      disabled={!canEditThisDeveloper}
      title={!canEditThisDeveloper ? "You can only edit your own developers" : undefined}
      className={`px-3 py-1.5 rounded-md bg-white text-primary text-sm font-medium inline-flex items-center justify-center gap-2 ${
        canEditThisDeveloper
          ? "hover:bg-white/90"
          : "opacity-40 cursor-not-allowed"
      }`}
    >
      <Pencil size={14} />
      {t.developerPage?.editDeveloper || "Edit"}
    </button>
  );

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      closeOnOutsideClick={false}
      closeOnEscape={false}
      cancelLabel={
        isEdit && isEditing ? t.cancel : isEdit ? undefined : t.cancel
      }
      onCancel={handleCancel}
      submitLabel={
        isEditing ? (isEdit ? t.saveChangesButton : t.saveDeveloper) : undefined
      }
      onSubmit={isEditing ? handleSubmit : undefined}
      submitDisabled={isSubmitting}
      submitLoading={isSubmitting}
      headerTrailing={isEdit && !isEditing ? <HeaderEditButton /> : undefined}
      title={
        isEdit
          ? isEditing
            ? t.developerPage?.editDeveloper || "Edit Developer"
            : (locale === "ar" ? formData.ar_name : formData.en_name) || t.developerPage?.viewDeveloper || "Developer Details"
          : t.developerPage.addDeveloper
      }
    >
      {isEdit && !isEditing ? ViewMode() : EditMode()}
    </UnifiedDialog>
  );
}
