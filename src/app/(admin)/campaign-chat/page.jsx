"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Search, ToggleLeft, ToggleRight, Plus, ArrowDownUp } from "lucide-react";
import { fetchCampaignSessions, fetchCampaignSession, toggleCampaignAIReply, sendCampaignReply, updateCampaignSessionName, toggleCampaignFavorite, updateCampaignNotes } from "@/utils/api";
import { useCampaignChatAccess } from "@/hooks/useCampaignChatAccess";
import { SELECTION_COLORS } from "@/constants/colors";
import { CAMPAIGN_CHAT_PAGINATION } from "@/constants/campaign-chat";
import { LoadingSpinner, ContactListSkeleton } from "@/components/ui/loading-states";
import ErrorBoundary from "@/components/ui/error-boundary";

// Components
import ContactList from "./_components/ContactList";
import ChatPanel from "./_components/ChatPanel";
import AddNewWhatsappCampaignDialog from "./_components/AddNewWhatsappCampaignDialog";

const CampaignChat = () => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiFilter, setAiFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTogglingAI, setIsTogglingAI] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState("last_user_message_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const queryClient = useQueryClient();

  // Use shared access control hook
  const { isAdmin, clientId, canAccessCampaignChat, isLoading: accessLoading } = useCampaignChatAccess();

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      // Clean up any ongoing queries when component unmounts
      queryClient.cancelQueries({ queryKey: ["campaignSessions"] });
      queryClient.cancelQueries({ queryKey: ["campaignSession"] });
    };
  }, [queryClient]);

  // Fetch sessions list
  const { data: sessionsData, isLoading: sessionsLoading, error: sessionsError } = useQuery({
    queryKey: ["campaignSessions", searchQuery, aiFilter, currentPage],
    queryFn: () => fetchCampaignSessions({
      search: searchQuery,
      ai_reply_enabled: aiFilter,
      page: currentPage,
      page_size: CAMPAIGN_CHAT_PAGINATION.DEFAULT_PAGE_SIZE
    }),
    enabled: canAccessCampaignChat,
    keepPreviousData: true
  });

  // Fetch selected session details
  const { data: sessionData, isLoading: sessionLoading, refetch: refetchSession } = useQuery({
    queryKey: ["campaignSession", selectedContact?.phone_number],
    queryFn: () => fetchCampaignSession({
      phone_number: selectedContact?.phone_number,
      history_page: CAMPAIGN_CHAT_PAGINATION.DEFAULT_PAGE,
      history_page_size: CAMPAIGN_CHAT_PAGINATION.DEFAULT_HISTORY_PAGE_SIZE
    }),
    enabled: !!selectedContact?.phone_number,
    keepPreviousData: true
  });

  // Handle contact selection
  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
  };

  // Handle AI toggle
  const handleToggleAI = async (phoneNumber, enabled) => {
    setIsTogglingAI(true);
    try {
      const result = await toggleCampaignAIReply({
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

  // Handle sending reply
  const handleSendReply = async (phoneNumber, message) => {
    try {
      await sendCampaignReply({
        phone_number: phoneNumber,
        admin_reply_text: message
      });
      await refetchSession();
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  };

  // Handle rename
  const handleRename = async (phoneNumber, userName) => {
    try {
      await updateCampaignSessionName({ phone_number: phoneNumber, user_name: userName });
      if (selectedContact?.phone_number === phoneNumber) {
        setSelectedContact(prev => ({ ...prev, user_name: userName }));
      }
      queryClient.invalidateQueries({ queryKey: ["campaignSessions"], refetchType: "active" });
      await refetchSession();
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (phoneNumber, isFavorite) => {
    try {
      await toggleCampaignFavorite({ phone_number: phoneNumber, is_favorite: isFavorite });
      if (selectedContact?.phone_number === phoneNumber) {
        setSelectedContact(prev => ({ ...prev, is_favorite: isFavorite }));
      }
      queryClient.invalidateQueries({ queryKey: ["campaignSessions"], refetchType: "active" });
      await refetchSession();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  // Handle notes update
  const handleUpdateNotes = async (phoneNumber, notes) => {
    try {
      await updateCampaignNotes({ phone_number: phoneNumber, notes });
      if (selectedContact?.phone_number === phoneNumber) {
        setSelectedContact(prev => ({ ...prev, notes }));
      }
      queryClient.invalidateQueries({ queryKey: ["campaignSessions"], refetchType: "active" });
    } catch (error) {
      console.error("Failed to update notes:", error);
    }
  };

  const sortedSessions = [...(sessionsData?.sessions || [])].sort((a, b) => {
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

  if (sessionsLoading) {
    return (
      <LoadingSpinner
        message="Loading conversations..."
        containerClassName="flex items-center justify-center h-full"
      />
    );
  }

  if (sessionsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Conversations</h2>
          <p className="text-red-500">{sessionsError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Left Panel - Contact List */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-semibold text-gray-800">Campaign Chat</h1>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            >
              <Plus size={16} />
              Create
            </button>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* AI Filter */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setAiFilter(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                aiFilter === null
                  ? SELECTION_COLORS.SELECTED
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAiFilter(true)}
              className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center gap-1 ${
                aiFilter === true
                  ? SELECTION_COLORS.SELECTED
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <ToggleRight className="h-3 w-3" />
              AI On
            </button>
            <button
              onClick={() => setAiFilter(false)}
              className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center gap-1 ${
                aiFilter === false
                  ? SELECTION_COLORS.SELECTED
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <ToggleLeft className="h-3 w-3" />
              AI Off
            </button>
          </div>

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
              Last Message
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
              Most Messages
              {sortBy === "total_messages_received" && (
                <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
              )}
            </button>
          </div>
        </div>

        {/* Contact List */}
        <ErrorBoundary errorMessage="Failed to load conversations. Please try again.">
          <ContactList
            sessions={sortedSessions}
            selectedContact={selectedContact}
            onContactSelect={handleContactSelect}
            loading={sessionsLoading || isTogglingAI}
            onRename={handleRename}
            onToggleFavorite={handleToggleFavorite}
          />
        </ErrorBoundary>

        {/* Pagination */}
        {sessionsData?.total_pages > 1 && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {sessionsData.total_pages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(sessionsData.total_pages, prev + 1))}
                disabled={currentPage === sessionsData.total_pages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Chat */}
      <div className="flex-1 flex flex-col">
        <ErrorBoundary errorMessage="Failed to load conversation. Please try again.">
          {selectedContact ? (
            <ChatPanel
              contact={selectedContact}
              sessionData={sessionData}
              loading={sessionLoading}
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
                <h3 className="text-lg font-medium text-gray-600 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a contact from the list to start chatting</p>
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
    </div>
  );
};

export default CampaignChat;
