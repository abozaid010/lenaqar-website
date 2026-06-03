"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Search, ToggleLeft, ToggleRight, ArrowDownUp, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { fetchCampaignSessions, fetchCampaignSession, toggleCampaignAIReply, sendCampaignReply, updateCampaignSessionName, toggleCampaignFavorite, updateCampaignNotes } from "@/utils/api";
import { useCampaignChatAccess } from "@/hooks/useCampaignChatAccess";
import { SELECTION_COLORS } from "@/constants/colors";
import { CAMPAIGN_CHAT_CLIENT_ID, CAMPAIGN_CHAT_PAGINATION } from "@/constants/campaign-chat";
import { DASHBOARD_ICON_BUTTON } from "@/constants/ui-classes";
import { LoadingSpinner, ContactListSkeleton } from "@/components/ui/loading-states";
import ErrorBoundary from "@/components/ui/error-boundary";
import { useI18n } from "@/hooks/useI18n";
import { useMessagingProviderConfig } from "@/hooks/useMessagingProviderConfig";
import { buildUnifiedReplyProviderPayload } from "@/lib/whatsapp-messaging-provider";

// Components
import ContactList from "./_components/ContactList";
import ChatPanel from "./_components/ChatPanel";
import AddNewWhatsappCampaignDialog from "./_components/AddNewWhatsappCampaignDialog";
import AddLeadDialog from "@/components/ui/add-lead-dialog";

const CampaignChat = () => {
  const { t, translate, locale } = useI18n();
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [aiFilter, setAiFilter] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const observerRef = useRef();
  const [isTogglingAI, setIsTogglingAI] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [sortBy, setSortBy] = useState("last_user_message_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [sessionDetails, setSessionDetails] = useState({});
  const queryClient = useQueryClient();

  // Debounce utility function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Use shared access control hook
  const { isAdmin, clientId, canAccessCampaignChat, isLoading: accessLoading } = useCampaignChatAccess();

  // Debounced search effect
  const debouncedSearch = useCallback(
    debounce((query) => setDebouncedSearchQuery(query), 400),
    []
  );

  // Update debounced search when searchQuery changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      // Clean up any ongoing queries when component unmounts
      queryClient.cancelQueries({ queryKey: ["campaignSessions"] });
      queryClient.cancelQueries({ queryKey: ["campaignSession"] });
      // Clean up intersection observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [queryClient]);

  const campaignChatClientId = clientId || CAMPAIGN_CHAT_CLIENT_ID;
  const { data: messagingConfig } = useMessagingProviderConfig(campaignChatClientId);

  const noRetryOnAuthDenial = (failureCount, error) => {
    const status = error?.response?.status;
    if (status === 403 || status === 401) return false;
    return failureCount < 2;
  };

  // Fetch sessions list
  const { data: sessionsData, isLoading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useQuery({
    queryKey: ["campaignSessions", campaignChatClientId, debouncedSearchQuery, aiFilter, page],
    queryFn: () => fetchCampaignSessions({
      client_id: campaignChatClientId,
      search: debouncedSearchQuery,
      ai_reply_enabled: aiFilter,
      page: page,
      page_size: CAMPAIGN_CHAT_PAGINATION.DEFAULT_PAGE_SIZE
    }),
    enabled: canAccessCampaignChat && Boolean(clientId),
    keepPreviousData: true,
    staleTime: 30000, // Cache for 30 seconds to reduce refetches
    refetchOnWindowFocus: false, // Don't refetch on window focus for better UX
    retry: noRetryOnAuthDenial,
  });

  // Fetch selected session details
  const {
    data: sessionData,
    isLoading: sessionLoading,
    isFetching: sessionFetching,
    error: sessionError,
    refetch: refetchSession,
  } = useQuery({
    queryKey: ["campaignSession", campaignChatClientId, selectedContact?.phone_number],
    queryFn: () => fetchCampaignSession({
      client_id: campaignChatClientId,
      phone_number: selectedContact?.phone_number,
      history_page: CAMPAIGN_CHAT_PAGINATION.DEFAULT_PAGE,
      history_page_size: CAMPAIGN_CHAT_PAGINATION.DEFAULT_HISTORY_PAGE_SIZE
    }),
    enabled: Boolean(selectedContact?.phone_number) && canAccessCampaignChat && Boolean(clientId),
    retry: noRetryOnAuthDenial,
  });

  // Update sessionDetails when sessionData is loaded
  useEffect(() => {
    if (sessionData && selectedContact?.phone_number) {
      setSessionDetails(prev => ({
        ...prev,
        [selectedContact.phone_number]: sessionData
      }));
    }
  }, [sessionData, selectedContact?.phone_number]);

  // Reset infinite scroll when filters change
  useEffect(() => {
    // Clean up previous observer before resetting
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    setAllSessions([]);
    setPage(1);
    setHasMore(true);
    setIsFetchingMore(false);
  }, [debouncedSearchQuery, aiFilter]);

  // Update allSessions when new data is fetched
  useEffect(() => {
    if (sessionsData) {
      // Handle case where API returns data but sessions array is missing
      const sessions = sessionsData.sessions || sessionsData.data || [];
      
      // Debug logging
      console.log("[Infinite Scroll] Received sessions data:", {
        page,
        sessionsCount: sessions.length,
        rawSessionsData: sessionsData,
        currentPage: sessionsData.current_page || sessionsData.page,
        totalPages: sessionsData.total_pages || sessionsData.totalPages,
        total: sessionsData.total,
        hasMoreData: sessionsData.has_more,
        allKeys: Object.keys(sessionsData)
      });
      
      if (sessions.length === 0) {
        console.log("[Infinite Scroll] No sessions in response, setting hasMore to false");
        setHasMore(false);
        setIsFetchingMore(false);
        return;
      }
      
      // Prevent duplicate data by checking if we already have these sessions
      if (page === 1) {
        setAllSessions(sessions);
      } else {
        setAllSessions(prev => {
          const existingPhoneNumbers = new Set(prev.map(s => s.phone_number));
          const newSessions = sessions.filter(s => !existingPhoneNumbers.has(s.phone_number));
          return [...prev, ...newSessions];
        });
      }
      
      // Handle different API response field names
      const currentPage = sessionsData.current_page || sessionsData.page || page;
      const totalPages = sessionsData.total_pages || sessionsData.totalPages || sessionsData.total;
      
      // Determine if there are more pages
      let hasMorePages;
      if (totalPages !== undefined) {
        // API provided total pages info
        hasMorePages = currentPage < totalPages;
      } else {
        // Fallback: if we received a full page of results, assume there might be more
        // This is a heuristic - if sessions.length == page_size, likely more exist
        const receivedFullPage = sessions.length >= CAMPAIGN_CHAT_PAGINATION.DEFAULT_PAGE_SIZE;
        hasMorePages = receivedFullPage;
      }
      
      console.log("[Infinite Scroll] Pagination status:", {
        currentPage,
        totalPages,
        receivedSessions: sessions.length,
        pageSize: CAMPAIGN_CHAT_PAGINATION.DEFAULT_PAGE_SIZE,
        hasMorePages,
        nextPage: hasMorePages ? page + 1 : null
      });
      
      setHasMore(hasMorePages);
      setIsFetchingMore(false);
    }
  }, [sessionsData, page]);

  // Handle API errors for infinite scroll
  useEffect(() => {
    if (sessionsError && page > 1) {
      setIsFetchingMore(false);
      // Don't reset page on error, just stop fetching more
    }
  }, [sessionsError, page]);

  // Infinite scroll observer
  const loadMoreRef = useCallback((node) => {
    if (isFetchingMore || !hasMore || !canAccessCampaignChat || sessionsError) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore && !sessionsError) {
          setIsFetchingMore(true);
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    if (node) observerRef.current.observe(node);
  }, [isFetchingMore, hasMore, canAccessCampaignChat, sessionsError]);

  // Manual load more function with debouncing to prevent rapid clicks
  const handleLoadMore = useCallback(() => {
    if (!isFetchingMore && hasMore && canAccessCampaignChat && !sessionsError) {
      setIsFetchingMore(true);
      // Small delay to prevent rapid successive calls
      setTimeout(() => {
        setPage(prev => prev + 1);
      }, 100);
    }
  }, [isFetchingMore, hasMore, canAccessCampaignChat, sessionsError]);

  // Retry function for failed loads
  const handleRetry = useCallback(() => {
    if (!isFetchingMore) {
      setIsFetchingMore(true);
      refetchSessions();
    }
  }, [isFetchingMore, refetchSessions]);

  // Handle contact selection
  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
  };

  // Handle AI toggle
  const handleToggleAI = async (phoneNumber, enabled) => {
    setIsTogglingAI(true);
    try {
      await toggleCampaignAIReply({
        client_id: campaignChatClientId,
        phone_number: phoneNumber,
        ai_reply_enabled: enabled
      });
      
      // Update the selected contact state immediately for better UX
      if (selectedContact && selectedContact.phone_number === phoneNumber) {
        setSelectedContact(prev => ({
          ...prev,
          ai_reply_enabled: enabled
        }));
      }
      
      // Refetch both sessions list and current session with proper cleanup
      await refetchSession();
      queryClient.invalidateQueries({ 
        queryKey: ["campaignSessions"],
        refetchType: 'active' // Only refetch active queries to prevent memory leaks
      });
    } catch (error) {
      console.error("Failed to toggle AI:", error);
      // Revert the state on error
      if (selectedContact && selectedContact.phone_number === phoneNumber) {
        setSelectedContact(prev => ({
          ...prev,
          ai_reply_enabled: !enabled
        }));
      }
      // Could show toast notification here
    } finally {
      setIsTogglingAI(false);
    }
  };

  const getErrorMessage = (error, fallback) => {
    if (error?.message === "Network Error") {
      return "Network error — please check your connection and try again.";
    }
    return (
      error?.response?.data?.error_message ||
      error?.response?.data?.message ||
      error?.message ||
      fallback
    );
  };

  const handleSendReply = async (phoneNumber, message) => {
    const providerPayload = buildUnifiedReplyProviderPayload(messagingConfig);
    if (!providerPayload.provider) {
      toast.error(
        translate(
          "editClient.whatsapp.notConfigured",
          "WhatsApp messaging is not configured for this client.",
        ),
      );
      return;
    }

    try {
      await sendCampaignReply({
        client_id: campaignChatClientId,
        phone_number: phoneNumber,
        admin_reply_text: message,
        ...providerPayload,
      });
      await refetchSession();
    } catch (error) {
      console.error("Failed to send reply:", error);
      toast.error(
        getErrorMessage(
          error,
          translate(
            "dashboardFilter.bulkWhatsapp.sendFailed",
            t?.dashboardFilter?.bulkWhatsapp?.sendFailed,
          ),
        ),
      );
    }
  };

  // Handle rename
  const handleRename = async (phoneNumber, userName) => {
    try {
      await updateCampaignSessionName({
        client_id: campaignChatClientId,
        phone_number: phoneNumber,
        user_name: userName,
      });
      queryClient.invalidateQueries({ queryKey: ["campaignSessions"], refetchType: "active" });
      
      // Update session details if it's the currently selected contact
      if (selectedContact?.phone_number === phoneNumber) {
        setSessionDetails(prev => ({
          ...prev,
          [phoneNumber]: {
            ...prev[phoneNumber],
            user_name: userName
          }
        }));
      }
      
      // Update the session in allSessions
      setAllSessions(prev => prev.map(session => 
        session.phone_number === phoneNumber 
          ? { ...session, user_name: userName }
          : session
      ));
    } catch (error) {
      console.error("Failed to rename session:", error);
      toast.error("Failed to rename conversation");
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (phoneNumber, isFavorite) => {
    try {
      await toggleCampaignFavorite({
        client_id: campaignChatClientId,
        phone_number: phoneNumber,
        is_favorite: isFavorite,
      });
      queryClient.invalidateQueries({ queryKey: ["campaignSessions"], refetchType: "active" });
      
      // Update session details if it's the currently selected contact
      if (selectedContact?.phone_number === phoneNumber) {
        setSessionDetails(prev => ({
          ...prev,
          [phoneNumber]: {
            ...prev[phoneNumber],
            is_favorite: isFavorite
          }
        }));
      }
      
      // Update the session in allSessions
      setAllSessions(prev => prev.map(session => 
        session.phone_number === phoneNumber 
          ? { ...session, is_favorite: isFavorite }
          : session
      ));
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Failed to update favorite status");
    }
  };

  const handleUpdateNotes = async (phoneNumber, notes) => {
    try {
      await updateCampaignNotes({
        client_id: campaignChatClientId,
        phone_number: phoneNumber,
        notes,
      });
      if (selectedContact?.phone_number === phoneNumber) {
        setSelectedContact(prev => ({ ...prev, notes }));
      }
      queryClient.invalidateQueries({ queryKey: ["campaignSessions"], refetchType: "active" });
    } catch (error) {
      console.error("Failed to update notes:", error);
      toast.error(getErrorMessage(error, "Failed to save notes"));
      throw error;
    }
  };

  const sortedSessions = useMemo(() => {
    const sessions = [...allSessions];
    const sorted = sessions.sort((a, b) => {
      if (sortBy === "last_user_message_at") {
        const aTime = a.last_user_message_at ? new Date(a.last_user_message_at).getTime() : 0;
        const bTime = b.last_user_message_at ? new Date(b.last_user_message_at).getTime() : 0;
        return sortOrder === "desc" ? bTime - aTime : aTime - bTime;
      }
      // total_messages_received
      const aCount = a.total_messages_received || 0;
      const bCount = b.total_messages_received || 0;
      return sortOrder === "desc" ? bCount - aCount : aCount - bCount;
    });
    
    console.log("[ContactList] Sorted sessions:", {
      totalSessions: sorted.length,
      hasMore,
      page
    });
    
    return sorted;
  }, [allSessions, sortBy, sortOrder, hasMore, page]);

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Access denied state
  if (!accessLoading && !canAccessCampaignChat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
          <p className="text-gray-500">This feature is only available to administrators with public client access.</p>
        </div>
      </div>
    );
  }

  if (accessLoading) {
    return (
      <LoadingSpinner
        message="Checking access..."
        containerClassName="flex items-center justify-center h-full"
        size="large"
      />
    );
  }

  // Only show full-screen loading on initial load (no sessions yet)
  if (sessionsLoading && allSessions.length === 0) {
    return (
      <LoadingSpinner
        message="Loading conversations..."
        containerClassName="flex items-center justify-center h-full"
      />
    );
  }

  if (sessionsError && page === 1) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Conversations</h2>
          <p className="text-red-500 mb-4">{sessionsError.message || "Failed to load conversations"}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Left Panel - Contact List */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
        {/* Header Container */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:justify-between">
          {/* Search Input */}
          <div className="w-full md:w-auto md:flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 h-10 bg-[#F6F7FB] border-[#E6E6E6] text-[#494A4B] rounded-md text-sm hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {/* Action Buttons — icon-only; labels in title / aria-label */}
          <div className="w-full md:w-auto flex-shrink-0 flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setIsAddLeadOpen(true)}
              className={`${DASHBOARD_ICON_BUTTON} !h-10 !w-10 !min-h-10 !min-w-10 border-primary text-primary hover:bg-primary/5 hover:text-primary`}
              title={translate("dashboardFilter.ADD", t?.dashboardFilter?.ADD || "Add New Lead")}
              aria-label={translate("dashboardFilter.ADD", t?.dashboardFilter?.ADD || "Add New Lead")}
            >
              <UserPlus className="w-[18px] h-[18px] shrink-0" strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setIsCreateDialogOpen(true)}
              className={`${DASHBOARD_ICON_BUTTON} !h-10 !w-10 !min-h-10 !min-w-10 hover:text-green-600 hover:border-green-400 hover:bg-green-50`}
              title={translate(
                "dashboardFilter.bulkWhatsapp.sendButton",
                t?.dashboardFilter?.bulkWhatsapp?.sendButton || "Send WhatsApp"
              )}
              aria-label={translate(
                "dashboardFilter.bulkWhatsapp.sendButton",
                t?.dashboardFilter?.bulkWhatsapp?.sendButton || "Send WhatsApp"
              )}
            >
              <svg
                className="w-[18px] h-[18px] shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Margin Separator */}
      <div className="h-4 bg-gray-100"></div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1">
          <ArrowDownUp className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <button
            onClick={() => handleSortChange("last_user_message_at")}
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              sortBy === "last_user_message_at"
                ? SELECTION_COLORS.SELECTED
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {translate('campaignChat.lastMessage')}
            {sortBy === "last_user_message_at" && (
              <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
            )}
          </button>
          <button
            onClick={() => handleSortChange("total_messages_received")}
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              sortBy === "total_messages_received"
                ? SELECTION_COLORS.SELECTED
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {translate('campaignChat.mostMessages')}
            {sortBy === "total_messages_received" && (
              <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
            )}
          </button>
        </div>

        {/* Contact List */}
        <ErrorBoundary errorMessage={translate('campaignChat.failedToLoadConversations')}>
          <ContactList
            sessions={sortedSessions}
            selectedContact={selectedContact}
            onContactSelect={handleContactSelect}
            loading={false}
            onRename={handleRename}
            onToggleFavorite={handleToggleFavorite}
            sessionDetails={sessionDetails}
            hasMore={hasMore}
            isFetchingMore={isFetchingMore}
            onLoadMore={handleLoadMore}
            loadMoreRef={loadMoreRef}
            sessionsError={sessionsError && page > 1}
            onRetry={handleRetry}
          />
        </ErrorBoundary>

      </div>

      {/* Right Panel - Chat */}
        <div className="flex-1 flex flex-col">
          <ErrorBoundary errorMessage={translate('campaignChat.failedToLoadConversation')}>
            {selectedContact ? (
              <ChatPanel
                contact={selectedContact}
                sessionData={sessionData}
                loading={sessionLoading || sessionFetching}
                sessionError={sessionError}
                onRetrySession={refetchSession}
                onToggleAI={handleToggleAI}
                onSendReply={handleSendReply}
                refetchSession={refetchSession}
                onRename={handleRename}
                onToggleFavorite={handleToggleFavorite}
                onUpdateNotes={handleUpdateNotes}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">{translate('campaignChat.selectConversation')}</h3>
                  <p className="text-gray-500">{translate('campaignChat.chooseContact')}</p>
                </div>
              </div>
            )}
          </ErrorBoundary>
        </div>

      {/* WhatsApp Campaign Dialog */}
      <AddNewWhatsappCampaignDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)} 
      />

      <AddLeadDialog
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        clientId={clientId}
      />
    </div>
  );
};

export default CampaignChat;
