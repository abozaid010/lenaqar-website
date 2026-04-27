"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Globe, Mail, Phone, MessageCircle, Calendar, Star, CheckCircle, AlertCircle, Edit, Trash2, ExternalLink, Users, TrendingUp, Shield, Building, MapPin } from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import AddDeveloperDialog from "@/components/ui/add-developer-dialog";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import { useI18n } from "@/context/translate-api";
import { useDeveloperDetails } from "@/hooks/use-admin-shared-data";
import { useBrokerPermission } from "@/hooks/useBrokerPermission";
import { useModuleActions } from "@/hooks/useModuleActions";
import { deleteDeveloper } from "@/utils/api";
import { developerKeys } from "@/utils/query-utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useState, useRef } from "react";

export default function DeveloperDetailsPage({ developerId, clientId, searchParams }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, locale } = useI18n();
  const { isDeveloper } = useBrokerPermission();
  const { canCreate: canEditDeveloper, has: hasDeveloperAction } = useModuleActions("developers");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteInFlightRef = useRef(false);
  
  const { 
    data: developer, 
    isLoading, 
    isError,
    error 
  } = useDeveloperDetails(developerId);

  const handleBack = () => {
    const listPath = clientId ? `/${clientId}/developers` : `/developers`;
    const qs = searchParams ? `?${new URLSearchParams(searchParams).toString()}` : "";
    router.push(`${listPath}${qs}`);
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!developer?.id || deleteInFlightRef.current) return;
    deleteInFlightRef.current = true;
    try {
      const res = await deleteDeveloper(developer.id);
      if (!res?.status) {
        toast.error(t?.common?.failedToDelete || "Failed to delete developer");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: developerKeys.all });
      toast.success(t?.common?.developerDeleted || "Developer deleted");
      setShowDeleteDialog(false);
      handleBack();
    } catch (err) {
      console.error("Delete developer failed:", err);
      toast.error(t?.common?.failedToDelete || "Failed to delete developer");
    } finally {
      deleteInFlightRef.current = false;
    }
  };

  const handleDeveloperUpdated = (updatedDeveloper) => {
    setIsEditDialogOpen(false);
    toast.success("Developer updated successfully");
    // The useDeveloperDetails hook will automatically refetch the data
  };

  const handleContactAction = (type, value) => {
    switch (type) {
      case "email":
        window.open(`mailto:${value}`, "_blank");
        break;
      case "phone":
        window.open(`tel:${value}`, "_blank");
        break;
      case "whatsapp":
        window.open(`https://wa.me/${value.replace(/[^\d]/g, '')}`, "_blank");
        break;
      case "website":
      case "linkedin":
      case "facebook":
      case "instagram":
        window.open(value, "_blank", "noopener,noreferrer");
        break;
      default:
        break;
    }
  };

  // Validate developerId
  if (!developerId) {
    console.error("❌ No developerId provided to DeveloperDetailsPage");
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Developer ID
          </h2>
          <p className="text-gray-600 mb-6">
            No developer ID was provided. Please go back and select a developer.
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-[#030250] text-white rounded-lg hover:bg-[#040361] transition-colors font-medium"
          >
            {t.common?.back || "Back to Developers"}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    console.error("❌ Error loading developer details:", error);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Developer
          </h2>
          <p className="text-gray-600 mb-6">
            {error?.message || "Failed to load developer details. Please try again."}
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-[#030250] text-white rounded-lg hover:bg-[#040361] transition-colors font-medium"
          >
            {t.common?.back || "Back to Developers"}
          </button>
        </div>
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t.developerPage?.detailsError || "Developer Not Found"}
          </h2>
          <p className="text-gray-600 mb-6">
            The developer you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-[#030250] text-white rounded-lg hover:bg-[#040361] transition-colors font-medium"
          >
            {t.common?.back || "Back to Developers"}
          </button>
        </div>
      </div>
    );
  }

  const displayName =
    locale === "ar"
      ? developer.ar_name || developer.en_name
      : developer.en_name || developer.ar_name;

  const aboutText =
    locale === "ar"
      ? developer.ar_description || developer.description
      : developer.description || developer.ar_description;

  const updatedAtMs = developer.updated_at ? Date.parse(developer.updated_at) : NaN;
  const lastUpdatedLabel = Number.isFinite(updatedAtMs)
    ? new Date(updatedAtMs).toLocaleDateString()
    : "—";

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-[#030250] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t.common?.back || "Back"}
            </button>
            
            {canEditDeveloper && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleEdit}
                  className="flex items-center px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {t.common?.edit || "Edit"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="flex items-center px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t.common?.delete || "Delete"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Developer Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {displayName}
              </h1>
              {developer.founded_year && (
                <p className="text-gray-600">
                  {t.developerPage?.founded || "Founded"} {developer.founded_year}
                </p>
              )}
            </div>
            
            {/* Quick Contact */}
            <div className="flex items-center gap-3">
              {developer.sales_email && (
                <button
                  onClick={() => handleContactAction("email", developer.sales_email)}
                  className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Email"
                >
                  <Mail className="w-5 h-5 text-gray-700" />
                </button>
              )}
              {developer.sales_phone && (
                <button
                  onClick={() => handleContactAction("phone", developer.sales_phone)}
                  className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Phone"
                >
                  <Phone className="w-5 h-5 text-gray-700" />
                </button>
              )}
              {developer.whatsapp && (
                <button
                  onClick={() => handleContactAction("whatsapp", developer.whatsapp)}
                  className="p-3 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                </button>
              )}
              {developer.website && (
                <button
                  onClick={() => handleContactAction("website", developer.website)}
                  className="p-3 bg-[#030250] rounded-lg hover:bg-[#040361] transition-colors"
                  title="Website"
                >
                  <Globe className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t.developerPage?.about || "About"}
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {aboutText}
            </p>
          </div>
        </div>

        {/* Contact & Social Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Contact Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t.developerPage?.contactInfo || "Contact Information"}
            </h2>
            <div className="space-y-4">
              {developer.sales_email && (
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <button
                      onClick={() => handleContactAction("email", developer.sales_email)}
                      className="text-[#030250] hover:underline"
                    >
                      {developer.sales_email}
                    </button>
                  </div>
                </div>
              )}
              
              {developer.sales_phone && (
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <button
                      onClick={() => handleContactAction("phone", developer.sales_phone)}
                      className="text-[#030250] hover:underline"
                    >
                      {developer.sales_phone}
                    </button>
                  </div>
                </div>
              )}
              
              {developer.whatsapp && (
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-gray-600 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                    <button
                      onClick={() => handleContactAction("whatsapp", developer.whatsapp)}
                      className="text-green-600 hover:underline"
                    >
                      {developer.whatsapp}
                    </button>
                  </div>
                </div>
              )}
              
              {developer.website && (
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <Globe className="w-5 h-5 text-gray-600 mr-4" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Website</p>
                    <button
                      onClick={() => handleContactAction("website", developer.website)}
                      className="text-[#030250] hover:underline truncate max-w-xs"
                    >
                      {developer.website}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          {(developer.linkedin || developer.facebook || developer.instagram) && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t.developerPage?.socialLinks || "Social Links"}
              </h2>
              <div className="space-y-4">
                {developer.linkedin && (
                  <button
                    onClick={() => handleContactAction("linkedin", developer.linkedin)}
                    className="w-full flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <Building className="w-5 h-5 text-blue-600 mr-4" />
                    <span className="text-gray-900">LinkedIn</span>
                  </button>
                )}
                {developer.facebook && (
                  <button
                    onClick={() => handleContactAction("facebook", developer.facebook)}
                    className="w-full flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <Building className="w-5 h-5 text-blue-600 mr-4" />
                    <span className="text-gray-900">Facebook</span>
                  </button>
                )}
                {developer.instagram && (
                  <button
                    onClick={() => handleContactAction("instagram", developer.instagram)}
                    className="w-full flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <Building className="w-5 h-5 text-pink-600 mr-4" />
                    <span className="text-gray-900">Instagram</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Reviews Section */}
        {developer.profile_reviews && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {t.developerPage?.profileReview || "Profile Review"}
            </h2>
            
            {/* Ratings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* Financial State */}
              {developer.profile_reviews.financial_state && (
                <div className="p-6 border border-gray-200 rounded-lg">
                  <div className="flex items-center mb-4">
                    <TrendingUp className="w-6 h-6 text-[#030250] mr-3" />
                    <h3 className="font-semibold text-gray-900">
                      {t.developerPage?.financialState || "Financial State"}
                    </h3>
                  </div>
                  {developer.profile_reviews.financial_state_rate && (
                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        {[...Array(10)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < developer.profile_reviews.financial_state_rate
                                ? "text-yellow-500 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {developer.profile_reviews.financial_state_rate}/10
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {locale === "ar" 
                      ? developer.profile_reviews.financial_state.ar 
                      : developer.profile_reviews.financial_state.en
                    }
                  </p>
                </div>
              )}

              {/* Developer Reputation */}
              {developer.profile_reviews.developer_reputation && (
                <div className="p-6 border border-gray-200 rounded-lg">
                  <div className="flex items-center mb-4">
                    <Users className="w-6 h-6 text-[#030250] mr-3" />
                    <h3 className="font-semibold text-gray-900">
                      {t.developerPage?.reputation || "Reputation"}
                    </h3>
                  </div>
                  {developer.profile_reviews.developer_reputation_rate && (
                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        {[...Array(10)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < developer.profile_reviews.developer_reputation_rate
                                ? "text-yellow-500 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {developer.profile_reviews.developer_reputation_rate}/10
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {locale === "ar" 
                      ? developer.profile_reviews.developer_reputation.ar 
                      : developer.profile_reviews.developer_reputation.en
                    }
                  </p>
                </div>
              )}

              {/* Legal Compliance */}
              {developer.profile_reviews.legal_compliance_score && (
                <div className="p-6 border border-gray-200 rounded-lg">
                  <div className="flex items-center mb-4">
                    <Shield className="w-6 h-6 text-[#030250] mr-3" />
                    <h3 className="font-semibold text-gray-900">
                      {t.developerPage?.legalCompliance || "Legal Compliance"}
                    </h3>
                  </div>
                  <div className="flex items-center mb-3">
                    <div className="flex items-center">
                      {[...Array(10)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < developer.profile_reviews.legal_compliance_score
                              ? "text-yellow-500 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {developer.profile_reviews.legal_compliance_score}/10
                      </span>
                    </div>
                  </div>
                  {developer.profile_reviews.legal_compliance_clients && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {locale === "ar" 
                        ? developer.profile_reviews.legal_compliance_clients.ar 
                        : developer.profile_reviews.legal_compliance_clients.en
                      }
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Projects Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* In Progress Projects */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t.developerPage?.inProgressProjects || "In Progress Projects"}
                </h3>
                {developer.profile_reviews.in_progress_projects?.length > 0 ? (
                  <div className="space-y-3">
                    {developer.profile_reviews.in_progress_projects.map((project, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-[#030250] mr-3 flex-shrink-0" />
                        <span className="text-gray-900">{project}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    {t.developerPage?.noProjects || "No projects listed"}
                  </p>
                )}
              </div>

              {/* Delivered Projects */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t.developerPage?.deliveredProjects || "Delivered Projects"}
                </h3>
                {developer.profile_reviews.delivered_projects?.length > 0 ? (
                  <div className="space-y-3">
                    {developer.profile_reviews.delivered_projects.map((project, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                        <span className="text-gray-900">{project}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    {t.developerPage?.noDeliveredProjects || "No delivered projects listed"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-600">
            <div>
              <p className="mb-2">
                <strong>{t.developerPage?.clientId || "Client ID"}:</strong> {developer.client_id}
              </p>
              <p className="mb-2">
                <strong>{t.developerPage?.author || "Author"}:</strong> {developer.author}
              </p>
            </div>
            <div>
              <p className="mb-2">
                <strong>{t.developerPage?.lastUpdated || "Last Updated"}:</strong> {lastUpdatedLabel}
              </p>
              {developer.scoring && (
                <p className="mb-2">
                  <strong>{t.developerPage?.scoring || "Scoring"}:</strong> {developer.scoring}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Developer Dialog */}
      <AddDeveloperDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onEdit={handleDeveloperUpdated}
        client_id={clientId}
        developer={developer}
        initialEditMode={true}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title={t.developerPage?.DeleteTitle || "Delete developer"}
        message={t.developerPage?.deleteMessage || "Are you sure you want to delete this developer?"}
        confirmLabel={t.deleteButton || "Delete"}
        cancelLabel={t.cancelButton || "Cancel"}
      />
    </div>
  );
}
