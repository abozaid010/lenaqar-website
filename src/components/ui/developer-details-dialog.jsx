"use client";

import { X, Globe, Mail, Phone, MessageCircle, Calendar, Building, Star, CheckCircle, AlertCircle } from "lucide-react";
import LoadingSpinner from "./loading-spinner";
import { useI18n } from "@/context/translate-api";

export default function DeveloperDetailsDialog({ 
  isOpen, 
  onClose, 
  developer, 
  isLoading, 
  error 
}) {
  const { t, locale } = useI18n();

  if (!isOpen) return null;

  const handleWebsiteClick = (url) => {
    if (url && url.trim() !== "") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleEmailClick = (email) => {
    if (email && email.trim() !== "") {
      window.open(`mailto:${email}`, "_blank");
    }
  };

  const handlePhoneClick = (phone) => {
    if (phone && phone.trim() !== "") {
      window.open(`tel:${phone}`, "_blank");
    }
  };

  const handleWhatsAppClick = (whatsapp) => {
    if (whatsapp && whatsapp.trim() !== "") {
      // Enhanced sanitization to prevent XSS
      const sanitized = whatsapp
        .toString()
        .trim()
        .replace(/[^\d]/g, '') // Remove non-digits
        .substring(0, 15); // Limit to reasonable phone number length
      
      if (sanitized && sanitized.length > 0) {
        window.open(`https://wa.me/${sanitized}`, "_blank", "noopener,noreferrer");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {t.developerPage?.detailsTitle || "Developer Details"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">
              {t.developerPage?.detailsError || "Failed to load developer details"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {locale === "ar" ? developer.ar_name : developer.en_name}
            </h2>
            {developer.founded_year && (
              <p className="text-sm text-gray-600">
                {t.developerPage?.founded || "Founded"}: {developer.founded_year}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t.developerPage?.contactInfo || "Contact Information"}
            </h3>
            
            {developer.sales_email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <button
                  onClick={() => handleEmailClick(developer.sales_email)}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {developer.sales_email}
                </button>
              </div>
            )}
            
            {developer.sales_phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <button
                  onClick={() => handlePhoneClick(developer.sales_phone)}
                  className="text-green-600 hover:text-green-800 hover:underline"
                >
                  {developer.sales_phone}
                </button>
              </div>
            )}
            
            {developer.whatsapp && (
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <button
                  onClick={() => handleWhatsAppClick(developer.whatsapp)}
                  className="text-green-600 hover:text-green-800 hover:underline"
                >
                  WhatsApp: {developer.whatsapp}
                </button>
              </div>
            )}
            
            {developer.website && (
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <button
                  onClick={() => handleWebsiteClick(developer.website)}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {developer.website}
                </button>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t.developerPage?.socialLinks || "Social Links"}
            </h3>
            
            {developer.linkedin && (
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-gray-400" />
                <button
                  onClick={() => handleWebsiteClick(developer.linkedin)}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  LinkedIn
                </button>
              </div>
            )}
            
            {developer.facebook && (
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-gray-400" />
                <button
                  onClick={() => handleWebsiteClick(developer.facebook)}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Facebook
                </button>
              </div>
            )}
            
            {developer.instagram && (
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-gray-400" />
                <button
                  onClick={() => handleWebsiteClick(developer.instagram)}
                  className="text-pink-600 hover:text-pink-800 hover:underline"
                >
                  Instagram
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {t.developerPage?.about || "About"}
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {locale === "ar" ? developer.ar_description : developer.description}
          </p>
        </div>

        {/* Profile Reviews */}
        {developer.profile_reviews && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t.developerPage?.profileReview || "Profile Review"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financial State */}
              {developer.profile_reviews.financial_state && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t.developerPage?.financialState || "Financial State"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {locale === "ar" 
                      ? developer.profile_reviews.financial_state.ar 
                      : developer.profile_reviews.financial_state.en
                    }
                  </p>
                  {developer.profile_reviews.financial_state_rate && (
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">
                        {developer.profile_reviews.financial_state_rate}/10
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Developer Reputation */}
              {developer.profile_reviews.developer_reputation && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t.developerPage?.reputation || "Reputation"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {locale === "ar" 
                      ? developer.profile_reviews.developer_reputation.ar 
                      : developer.profile_reviews.developer_reputation.en
                    }
                  </p>
                  {developer.profile_reviews.developer_reputation_rate && (
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">
                        {developer.profile_reviews.developer_reputation_rate}/10
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  {t.developerPage?.inProgressProjects || "In Progress Projects"}
                </h4>
                {developer.profile_reviews.in_progress_projects?.length > 0 ? (
                  <ul className="text-sm text-blue-800 space-y-1">
                    {developer.profile_reviews.in_progress_projects.map((project, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        {project}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-blue-600">
                    {t.developerPage?.noProjects || "No projects listed"}
                  </p>
                )}
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">
                  {t.developerPage?.deliveredProjects || "Delivered Projects"}
                </h4>
                {developer.profile_reviews.delivered_projects?.length > 0 ? (
                  <ul className="text-sm text-green-800 space-y-1">
                    {developer.profile_reviews.delivered_projects.map((project, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {project}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-green-600">
                    {t.developerPage?.noDeliveredProjects || "No delivered projects listed"}
                  </p>
                )}
              </div>
            </div>

            {/* Legal Compliance */}
            {developer.profile_reviews.legal_compliance_score && (
              <div className="mt-4 bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">
                  {t.developerPage?.legalCompliance || "Legal Compliance"}
                </h4>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-500 fill-current" />
                  <span className="text-sm font-medium text-purple-800">
                    {developer.profile_reviews.legal_compliance_score}/10
                  </span>
                </div>
                {developer.profile_reviews.legal_compliance_clients && (
                  <p className="text-sm text-purple-600 mt-2">
                    {locale === "ar" 
                      ? developer.profile_reviews.legal_compliance_clients.ar 
                      : developer.profile_reviews.legal_compliance_clients.en
                    }
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t.common?.close || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
