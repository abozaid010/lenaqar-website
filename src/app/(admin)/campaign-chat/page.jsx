"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { fetchCampaignSessions, fetchCampaignSession, toggleCampaignAIReply, sendCampaignReply } from "@/utils/api";
import { getRoleFromToken, getClientIdFromToken } from "@/lib/getRoleFromToken.client";
import { SELECTION_COLORS } from "@/constants/colors";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Components
import ContactList from "./_components/ContactList";
import ChatPanel from "./_components/ChatPanel";

const CampaignChat = () => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiFilter, setAiFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [isTogglingAI, setIsTogglingAI] = useState(false);
  const queryClient = useQueryClient();

  // Check admin role and client_id on mount
  useEffect(() => {
    const checkAccess = () => {
      try {
        const role = getRoleFromToken();
        const currentClientId = getClientIdFromToken();
        
        const hasAdminAccess = ["admin", "owner"].includes(role?.toLowerCase());
        
        setIsAdmin(hasAdminAccess);
        setClientId(currentClientId);
      } catch (error) {
        console.error("Error checking access:", error);
        setIsAdmin(false);
      }
    };

    checkAccess();
  }, []);

  // Fetch sessions list
  const { data: sessionsData, isLoading: sessionsLoading, error: sessionsError } = useQuery({
    queryKey: ["campaignSessions", searchQuery, aiFilter, currentPage],
    queryFn: () => fetchCampaignSessions({
      search: searchQuery,
      ai_reply_enabled: aiFilter,
      page: currentPage,
      page_size: 20
    }),
    enabled: isAdmin && clientId === "public",
    keepPreviousData: true
  });

  // Fetch selected session details
  const { data: sessionData, isLoading: sessionLoading, refetch: refetchSession } = useQuery({
    queryKey: ["campaignSession", selectedContact?.phone_number],
    queryFn: () => fetchCampaignSession({
      phone_number: selectedContact?.phone_number
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
      console.log('Toggling AI:', { phoneNumber, enabled });
      
      const result = await toggleCampaignAIReply({
        phone_number: phoneNumber,
        ai_reply_enabled: enabled
      });
      
      console.log('Toggle AI Result:', result);
      
      // Update the selected contact state immediately for better UX
      if (selectedContact && selectedContact.phone_number === phoneNumber) {
        setSelectedContact(prev => ({
          ...prev,
          ai_reply_enabled: enabled
        }));
      }
      
      // Refetch both sessions list and current session
      refetchSession();
      // Trigger sessions refetch by invalidating the query
      queryClient.invalidateQueries(["campaignSessions"]);
    } catch (error) {
      console.error("Failed to toggle AI:", error);
      // Revert the state on error
      if (selectedContact && selectedContact.phone_number === phoneNumber) {
        setSelectedContact(prev => ({
          ...prev,
          ai_reply_enabled: !enabled
        }));
      }
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
      
      // Refetch session to show new message
      refetchSession();
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  };

  // Access denied state
  if (!isAdmin || clientId !== "public") {
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
          <h1 className="text-lg font-semibold text-gray-800 mb-4">Campaign Chat</h1>
          
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
          <div className="flex gap-2">
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
        </div>

        {/* Contact List */}
        <ContactList
          sessions={sessionsData?.sessions || []}
          selectedContact={selectedContact}
          onContactSelect={handleContactSelect}
          loading={sessionsLoading || isTogglingAI} // Add isTogglingAI to loading state
        />

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
        {selectedContact ? (
          <ChatPanel
            contact={selectedContact}
            sessionData={sessionData}
            loading={sessionLoading}
            onToggleAI={handleToggleAI}
            onSendReply={handleSendReply}
            refetchSession={refetchSession}
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
      </div>
    </div>
  );
};

export default CampaignChat;
