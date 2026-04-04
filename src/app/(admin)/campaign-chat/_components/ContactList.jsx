"use client";

import { formatDistanceToNow } from "date-fns";
import { Bot, User, MessageCircle } from "lucide-react";
import { SELECTION_COLORS } from "@/constants/colors";
import { ContactListSkeleton } from "@/components/ui/loading-states";
import ErrorBoundary from "@/components/ui/error-boundary";

const ContactList = ({ sessions, selectedContact, onContactSelect, loading }) => {
  const formatPhoneNumber = (phone) => {
    if (!phone) return "Unknown";
    // Format phone number for display (e.g., +20 100 123 4567)
    if (phone.startsWith('+')) {
      const cleaned = phone.substring(1);
      if (cleaned.length >= 12 && cleaned.startsWith('20')) {
        return `+20 ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8, 12)}`;
      }
    }
    return phone;
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "No messages";
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  if (loading) {
    return <ContactListSkeleton count={8} />;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No conversations found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {sessions.map((session) => {
        const isSelected = selectedContact?.phone_number === session.phone_number;
        
        return (
          <div
            key={session.phone_number}
            onClick={() => onContactSelect(session)}
            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
              isSelected 
                ? SELECTION_COLORS.SELECTED 
                : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isSelected ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
              }`}>
                {session.user_name ? (
                  <span className="text-sm font-medium">
                    {session.user_name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>

              {/* Contact Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-medium truncate ${
                    isSelected ? "text-primary" : "text-gray-900"
                  }`}>
                    {session.user_name || formatPhoneNumber(session.phone_number)}
                  </h3>
                  
                  {/* AI Status Indicator */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    session.ai_reply_enabled ? "bg-green-500" : "bg-gray-400"
                  }`} title={session.ai_reply_enabled ? "AI Enabled" : "AI Disabled"} />
                </div>

                {/* Phone Number */}
                {session.user_name && (
                  <p className="text-sm text-gray-500 mb-1">
                    {formatPhoneNumber(session.phone_number)}
                  </p>
                )}

                {/* Message Count and Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {session.ai_reply_enabled && (
                      <Bot className="h-3 w-3" title="AI Auto-Reply Enabled" />
                    )}
                    <span>{session.total_messages_received} messages</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {getRelativeTime(session.last_user_message_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContactList;
