"use client";

import AddDeveloperDialog from "@/components/ui/add-developer-dialog";
import ImportDevelopersDialog from "@/components/ui/import-developers-dialog";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import LoadingSpinner from "@/components/ui/loading-spinner";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { useI18n } from "@/context/translate-api";
import { useDevelopers, useDeveloperNames } from "@/hooks/use-admin-shared-data";
import { deleteDeveloper } from "@/utils/api";
import { filterBySearchQuery } from "@/utils/search-utils";
import { MoreVertical, Pencil, Phone, Mail, Plus, Trash2, Search } from "lucide-react";
import VideoInstructionsDialog from "@/components/ui/video-instructions-dialog";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import EmptyStateVideo from "@/components/ui/empty-state-video";
import QueryErrorState from "@/components/ui/query-error-state";
import OwnerActions from "@/components/ui/owner-actions";
import ImageWithLoader from "@/components/ui/image-with-loader";
import { useBrokerPermission } from "@/hooks/useBrokerPermission";
import { useModuleActions } from "@/hooks/useModuleActions";

export default function DevelopersClientWrapper({ clientId }) {
  const router = useRouter();
  
  // List: slim API + infinite scroll. Header search dropdown: full names (`get_all_names`).
  const {
    data: developersData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useDevelopers(clientId, true);

  const {
    data: developerNamesData,
    isLoading: developerNamesLoading,
  } = useDeveloperNames();
  const { t, locale } = useI18n();
  const { isDeveloper } = useBrokerPermission();
  const {
    canCreate: canCreateDeveloper,
    has: hasDeveloperAction,
  } = useModuleActions("developers");
  const canImportDevelopers = hasDeveloperAction("import");
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const [selectedDeveloperSearch, setSelectedDeveloperSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openInEditMode, setOpenInEditMode] = useState(false);
  const menuRefs = useRef({});
  const scrollContainerRef = useRef(null);

  // Function to handle viewing developer details
  const handleViewDeveloperDetails = useCallback((developer) => {
    const path = clientId
      ? `/${clientId}/developers/${developer.id}`
      : `/developers/${developer.id}`;
    router.push(path);
  }, [router, clientId]);

  // Infinite scroll handler
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Check if user has scrolled to near the bottom (within 100px)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      if (hasNextPage && !isFetchingNextPage && !isFetching) {
        console.log("🔄 Loading next page of developers...");
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, isFetching, fetchNextPage]);

  const developerOptions = useMemo(() => {
    if (!developerNamesData || !Array.isArray(developerNamesData)) return [];
    return developerNamesData.map((developer) => ({
      value: developer.id,
      label: locale === "ar" ? developer.ar_name : developer.en_name,
      ar_name: developer.ar_name,
      en_name: developer.en_name,
    }));
  }, [developerNamesData, locale]);

  const resolveDeveloperRow = useCallback(
    (id) => {
      if (!id) return null;
      const fromSlim = developersData?.find((d) => d.id === id);
      if (fromSlim) return fromSlim;
      return developerNamesData?.find((d) => d.id === id) ?? null;
    },
    [developersData, developerNamesData]
  );

  const filteredDevelopers = useMemo(() => {
    const slim =
      developersData && Array.isArray(developersData) ? developersData : [];

    if (selectedDeveloperSearch && selectedDeveloperSearch !== "") {
      const row = resolveDeveloperRow(selectedDeveloperSearch);
      return row ? [row] : [];
    }

    if (searchQuery && searchQuery.trim() !== "") {
      const names = developerNamesData;
      if (names && names.length > 0) {
        const nameMatches = filterBySearchQuery(names, searchQuery, [
          "ar_name",
          "en_name",
        ]);
        const idSet = new Set(nameMatches.map((d) => d.id).filter(Boolean));
        const fromSlim = slim.filter((d) => idSet.has(d.id));
        const slimIds = new Set(slim.map((d) => d.id));
        const nameOnly = nameMatches.filter((d) => d.id && !slimIds.has(d.id));
        const combined = [...fromSlim, ...nameOnly];
        const label = (d) =>
          (locale === "ar" ? d.ar_name : d.en_name) || d.en_name || d.ar_name || "";
        return combined.sort((a, b) =>
          label(a).localeCompare(label(b), locale === "ar" ? "ar" : "en", {
            sensitivity: "base",
          })
        );
      }
      return filterBySearchQuery(slim, searchQuery, ["ar_name", "en_name"]);
    }

    return slim;
  }, [
    developersData,
    developerNamesData,
    searchQuery,
    selectedDeveloperSearch,
    locale,
    resolveDeveloperRow,
  ]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId) {
        const menuRef = menuRefs.current[openMenuId];
        if (menuRef && !menuRef.contains(event.target)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleEdit = (updatedDeveloper) => {
    // Close dialog and clear selection
    setIsOpen(false);
    setSelectedDeveloper(null);
    
    // Refetch data to get updated list
    refetch().catch(error => {
      console.error("Failed to refetch developers after edit:", error);
      toast.error("Failed to refresh developers list");
    });
  };

  const handleAdd = (newDeveloper) => {
    // Close dialog and clear selection
    setIsOpen(false);
    setSelectedDeveloper(null);
    
    // Refetch data to get updated list
    refetch().catch(error => {
      console.error("Failed to refetch developers after add:", error);
      toast.error("Failed to refresh developers list");
    });
  };

  const handleDelete = async (developerId) => {
    try {
      const res = await deleteDeveloper(developerId);
      if (!res.status) {
        toast.error(t?.common?.failedToDelete);
        return;
      }

      // Refetch data to get updated list
      await refetch();
      toast.success(t?.common?.developerDeleted);
      setSelectedDeveloper(null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting developer:", error);
      toast.error(t?.common?.failedToDelete);
    }
  };

  const handleImported = async () => {
    try {
      await refetch();
      toast.success(
        t.developerPage?.importSuccess ||
          "Developers imported successfully."
      );
      setSearchQuery("");
    } catch (error) {
      console.error("Error refetching developers after import:", error);
      toast.error(
        t.developerPage?.importRefetchError ||
          "Imported, but failed to refresh developers list. Please reload the page."
      );
    }
  };

  // Normalize WhatsApp value into a URL with enhanced security:
  // - If input is already a URL (whatsapp.com / wa.me / http(s)), open as-is (with https:// if missing)
  // - Otherwise treat it as a phone number and build https://wa.me/<digits>
  //
  // Note: Without a default country code, local numbers like "010..." can't be reliably converted for all countries.
  const formatPhoneForWhatsApp = (value) => {
    if (!value) return "";
    const raw = String(value).trim();
    if (raw === "") return "";

    const lower = raw.toLowerCase();

    // Already has scheme - validate URL safety
    if (lower.startsWith("http://") || lower.startsWith("https://")) {
      // Basic URL validation to prevent XSS
      if (raw.includes("javascript:") || raw.includes("data:") || raw.includes("vbscript:")) {
        return "";
      }
      return raw;
    }

    // WhatsApp / wa.me URLs without scheme - validate safety
    if (lower.startsWith("wa.me/") || lower.startsWith("www.wa.me/")) return `https://${raw}`;
    if (lower.startsWith("whatsapp.com/") || lower.startsWith("www.whatsapp.com/"))
      return `https://${raw}`;
    if (lower.includes("wa.me/") || lower.includes("whatsapp.com/")) {
      if (raw.startsWith("//")) return `https:${raw}`;
      return `https://${raw.replace(/^\/+/, "")}`;
    }

    // Other URL (best-effort) - validate safety
    if (lower.startsWith("www.")) {
      if (raw.includes("javascript:") || raw.includes("data:") || raw.includes("vbscript:")) {
        return "";
      }
      return `https://${raw}`;
    }

    // Phone normalization with enhanced security
    let cleaned = raw.replace(/[\s\-\(\)\.]/g, "");
    if (cleaned.startsWith("00")) cleaned = cleaned.slice(2); // international prefix
    if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
    const digitsOnly = cleaned.replace(/\D/g, "");
    
    // Validate phone number length and format
    if (digitsOnly === "" || digitsOnly.length < 7 || digitsOnly.length > 15) {
      return "";
    }

    return `https://wa.me/${digitsOnly}`;
  };

  // Handle WhatsApp action
  const handleWhatsApp = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === "") return;
    const whatsappUrl = formatPhoneForWhatsApp(phoneNumber);
    if (!whatsappUrl) return;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  // Handle Call action
  const handleCall = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === "") return;
    window.location.href = `tel:${phoneNumber}`;
  };

  // Handle Email action
  const handleEmail = (email) => {
    if (!email || email.trim() === "") return;
    window.location.href = `mailto:${email}`;
  };

  // Handle Website action
  const handleWebsite = (url) => {
    if (!url || url.trim() === "") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Handle Instagram action
  const handleInstagram = (url) => {
    if (!url || url.trim() === "") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Handle LinkedIn action
  const handleLinkedIn = (url) => {
    if (!url || url.trim() === "") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Handle Facebook action
  const handleFacebook = (url) => {
    if (!url || url.trim() === "") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Handle row click to view developer details
  const handleRowClick = (developer) => {
    handleViewDeveloperDetails(developer);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Container */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:justify-between">
          {/* Search Dropdown */}
          <div className="w-full md:w-auto md:flex-1 min-w-0">
            <SearchableDropdownSelect
              options={developerOptions}
              value={selectedDeveloperSearch}
              onChange={(e) => setSelectedDeveloperSearch(e.target.value)}
              name="developer_search"
              placeholder={t.developerPage?.searchPlaceholder || "Search developers..."}
              showAllOption={true}
              allOptionLabel={locale === "ar" ? "جميع المطورين" : "All Developers"}
              allOptionValue=""
              getValue={(option) => option.value}
              getLabel={(option, loc) => loc === "ar" ? option.ar_name : option.en_name}
              searchFields={["ar_name", "en_name"]}
              className="w-full"
              buttonClassName="bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] text-sm h-10 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              disabled={developerNamesLoading && developerOptions.length === 0}
              isLoading={developerNamesLoading}
            />
          </div>

          {/* Action buttons */}
          <div className="w-full md:w-auto flex-shrink-0 flex gap-2 items-center">
            {canCreateDeveloper && (
              <button
                onClick={() => setIsOpen(true)}
                className="flex-1 md:flex-initial px-4 py-2 h-10 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
              >
                <Plus size={18} className="shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">
                  {t.developerPage.addDeveloper}
                </span>
              </button>
            )}
            {!isDeveloper && canImportDevelopers && (
              <button
                onClick={() => setIsImportOpen(true)}
                className="flex-1 md:flex-initial px-4 py-2 h-10 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
              >
                <Plus size={18} className="shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">
                  {t.developerPage?.importButton || "Import"}
                </span>
              </button>
            )}
            <div className="flex items-center justify-center w-10 h-10 bg-[#F6F7FB] border border-[#E6E6E6] rounded-md hover:border-primary/40 transition-colors">
              <VideoInstructionsDialog
                variant="developers"
                iconSize="sm"
                tooltipText={
                  t.developerPage?.instructions || "How to manage developers"
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="mt-4">
        <div className="bg-white h-fit rounded-lg shadow-sm border border-gray-200 overflow-hidden">

          <div 
            ref={scrollContainerRef}
            className="max-h-[80vh] overflow-y-auto"
            onScroll={handleScroll}
          >
            {isLoading ? (
              <LoadingSpinner containerClassName="flex items-center justify-center p-6" />
            ) : isError ? (
              <QueryErrorState
                error={error}
                refetch={refetch}
                isFetching={isFetching}
                title={t.developerPage?.errorTitle || "Error loading developers"}
                message={
                  t.developerPage?.errorMessage ||
                  "Failed to load developers. Please try again."
                }
                retryLabel={t.developerPage?.retryLabel || "Retry"}
              />
            ) : filteredDevelopers.length === 0 ? (
              // <div className="flex flex-col items-center justify-center p-6">
              //   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              //     <svg
              //       className="w-8 h-8 text-gray-400"
              //       fill="none"
              //       stroke="currentColor"
              //       viewBox="0 0 24 24"
              //     >
              //       <path
              //         strokeLinecap="round"
              //         strokeLinejoin="round"
              //         strokeWidth={2}
              //         d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2M7 7h10"
              //       />
              //     </svg>
              //   </div>
              //   <p className="text-center font-medium text-xl text-gray-400">
              //     {t.developerPage.NoDevelopers}
              //   </p>
              // </div>
              <EmptyStateVideo
                variant="developers"
                autoPlay
                showControls
                loop
              />
            ) : (
              <div className="space-y-3 p-4">
                {filteredDevelopers.map((d) => {
                  const displayDescription = locale === "ar" && d.ar_description ? d.ar_description : d.description;

                  return (
                    <div
                      key={d.id}
                      onClick={() => handleRowClick(d)}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      {/* Content */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1" style={{ color: '#030250' }}>
                            {locale === "ar" ? d.ar_name : d.en_name}
                          </h3>
                          {displayDescription && (
                            <p className="text-sm text-gray-700 line-clamp-2 whitespace-pre-line">
                              {displayDescription}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-sm flex-shrink-0">
                          {/* WhatsApp Button */}
                          {d.whatsapp != null && String(d.whatsapp).trim() !== "" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWhatsApp(d.whatsapp);
                              }}
                              className="h-8 w-8 p-2 bg-green-500 hover:bg-green-600 rounded-full shadow transition-all duration-200 flex items-center justify-center aspect-square flex-shrink-0"
                              style={{ height: '32px', width: '32px', minHeight: '32px', maxHeight: '32px' }}
                              title="Open WhatsApp"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 text-white"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
                              </svg>
                            </button>
                          )}

                          {/* Call Button */}
                          {d.sales_phone != null && String(d.sales_phone).trim() !== "" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCall(d.sales_phone);
                              }}
                              className="h-8 w-8 p-2 bg-blue-500 hover:bg-blue-600 rounded-full shadow transition-all duration-200 flex items-center justify-center aspect-square flex-shrink-0"
                              style={{ height: '32px', width: '32px', minHeight: '32px', maxHeight: '32px' }}
                              title="Call Developer"
                            >
                              <Phone size={16} className="text-white" />
                            </button>
                          )}

                          {/* Email Button */}
                          {d.sales_email != null && String(d.sales_email).trim() !== "" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmail(d.sales_email);
                              }}
                              className="h-8 w-8 p-2 bg-gray-500 hover:bg-gray-600 rounded-full shadow transition-all duration-200 flex items-center justify-center aspect-square flex-shrink-0"
                              style={{ height: '32px', width: '32px', minHeight: '32px', maxHeight: '32px' }}
                              title="Email Developer"
                            >
                              <Mail size={16} className="text-white" />
                            </button>
                          )}

                          {/* Three-dots Menu */}
                          <div
                            className="relative"
                            ref={(el) => {
                              menuRefs.current[d.id] = el;
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() =>
                                setOpenMenuId(openMenuId === d.id ? null : d.id)
                              }
                              className="ml-2 h-8 w-8 p-2 bg-white/90 text-gray-700 rounded-full shadow transition-all duration-200 hover:bg-primary hover:text-white aspect-square flex-shrink-0 flex items-center justify-center"
                              style={{ height: '32px', width: '32px', minHeight: '32px', maxHeight: '32px' }}
                              title="More options"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openMenuId === d.id && (
                              <OwnerActions item={d}>
                                <div
                                  className={`absolute ${locale === "ar" ? "left-0" : "right-0"} top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden`}
                                >
                                  <button
                                    onClick={() => {
                                      setSelectedDeveloper(d);
                                      setOpenInEditMode(true);
                                      setIsOpen(true);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150 flex items-center gap-2"
                                  >
                                    <Pencil size={14} />
                                    {t.developerPage?.editDeveloper || "Edit"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedDeveloper(d);
                                      setShowDeleteDialog(true);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left py-2 px-4 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center gap-2"
                                  >
                                    <Trash2 size={14} />
                                    {t.deleteButton || "Delete"}
                                  </button>
                                </div>
                              </OwnerActions>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Loading indicator for next page */}
                {isFetchingNextPage && (
                  <div className="flex justify-center p-4">
                    <LoadingSpinner />
                  </div>
                )}
                
                {/* End of list indicator */}
                {!hasNextPage && filteredDevelopers.length > 0 && (
                  <div className="text-center p-4 text-gray-500 text-sm">
                    {t.common?.endOfList || "End of developers list"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteDialog && selectedDeveloper && (
        <DeleteConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={() => handleDelete(selectedDeveloper.id)}
          title={t.developerPage.DeleteTitle}
          message={t.developerPage.deleteMessage}
          confirmLabel={t.deleteButton}
          cancelLabel={t.cancelButton}
        />
      )}

      <AddDeveloperDialog
        client_id={clientId}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSelectedDeveloper(null);
          setOpenInEditMode(false);
        }}
        onAdd={handleAdd}
        onEdit={handleEdit}
        developer={selectedDeveloper}
        initialEditMode={openInEditMode}
      />

      <ImportDevelopersDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        clientId={clientId}
        onImported={handleImported}
        existingDeveloperIds={filteredDevelopers.map((d) => d.id)}
      />
    </div>
  );
}
