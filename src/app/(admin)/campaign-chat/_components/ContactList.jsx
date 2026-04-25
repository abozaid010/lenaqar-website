"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, User, MessageCircle, Star, Pencil, Check, X, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { SELECTION_COLORS } from "@/constants/colors";
import { ContactListSkeleton } from "@/components/ui/loading-states";
import WhatsAppButton from "@/components/ui/whatsapp-button";
import CallButton from "@/components/ui/call-button";
import { handleCopyFullPhoneNumber } from "@/utils/phone-utils";
import { useI18n } from "@/hooks/useI18n";
import { useLocaleConstants } from "@/utils/localeConstants";

const ContactList = ({ sessions, selectedContact, onContactSelect, loading, onRename, onToggleFavorite, sessionDetails, hasMore, isFetchingMore, onLoadMore, loadMoreRef, sessionsError, onRetry }) => {
  const { t, locale } = useI18n();
  const { formatRelativeTime } = useLocaleConstants();
  const [editingPhone, setEditingPhone] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("all");
  const inputRef = useRef(null);
  const loadMoreButtonRef = useRef(null);

  // Derive all distinct template names from sessions (last_template_sent field)
  const allTemplates = [...new Set(
    sessions
      .filter(session => session.last_template_sent)
      .map(session => session.last_template_sent)
  )];

  // Filter sessions based on selected template
  const filteredSessions = selectedTemplate === "all"
    ? sessions
    : sessions.filter(session => session.last_template_sent === selectedTemplate);

  const formatPhoneNumber = (phone) => {
    if (!phone) return "Unknown";
    if (phone.startsWith('+')) {
      const cleaned = phone.substring(1);
      if (cleaned.length >= 12 && cleaned.startsWith('20')) {
        return `+20 ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8, 12)}`;
      }
    }
    return phone;
  };

  
  const startEdit = (e, session) => {
    e.stopPropagation();
    setEditingPhone(session.phone_number);
    setEditValue(session.user_name || "");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = async (e, session) => {
    e?.stopPropagation();
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== session.user_name) {
      try {
        await onRename?.(session.phone_number, trimmed);
      } catch {
        // Keep edit mode open so the user can retry without losing input.
        return;
      }
    }
    setEditingPhone(null);
  };

  const cancelEdit = (e) => {
    e?.stopPropagation();
    setEditingPhone(null);
  };

  const handleInputKeyDown = (e, session) => {
    e.stopPropagation();
    if (e.key === "Enter") commitEdit(e, session);
    if (e.key === "Escape") cancelEdit(e);
  };

  const handleFavorite = (e, session) => {
    e.stopPropagation();
    onToggleFavorite?.(session.phone_number, !session.is_favorite);
  };

  const handleCopyPhone = (e, phoneNumber) => {
    handleCopyFullPhoneNumber(
      e,
      phoneNumber,
      () => toast.success(t?.common?.phoneCopied),
      () => toast.error(t?.common?.failedToCopyPhone)
    );
  };

  // Show skeleton on initial load when no sessions yet
  if (!sessions || sessions.length === 0) {
    // If loading, show skeleton
    if (loading) {
      return <ContactListSkeleton count={8} />;
    }
    // Not loading and no sessions = empty state
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
      {/* Template Filter Pills */}
      {allTemplates.length > 0 && (
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedTemplate("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTemplate === "all"
                  ? "bg-primary text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
            >
              All
            </button>
            {allTemplates.map(template => (
              <button
                key={template}
                onClick={() => setSelectedTemplate(template)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTemplate === template
                    ? "bg-primary text-white"
                    : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {filteredSessions.map((session) => {
        const isSelected = selectedContact?.phone_number === session.phone_number;
        const isEditing = editingPhone === session.phone_number;

        return (
          <div
            key={session.phone_number}
            onClick={() => !isEditing && onContactSelect(session)}
            className={`group p-4 border-b border-gray-100 cursor-pointer transition-colors ${
              isSelected ? SELECTION_COLORS.SELECTED : "hover:bg-gray-50"
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
                <div className="flex items-center justify-between mb-1 gap-1">
                  {/* Inline rename */}
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                      <input
                        ref={inputRef}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => handleInputKeyDown(e, session)}
                        onBlur={e => commitEdit(e, session)}
                        className="flex-1 text-sm border border-primary rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary min-w-0"
                      />
                      <button
                        onMouseDown={e => { e.preventDefault(); commitEdit(e, session); }}
                        className="text-green-600 hover:text-green-700 flex-shrink-0"
                        aria-label="Save name"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onMouseDown={e => { e.preventDefault(); cancelEdit(e); }}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        aria-label="Cancel rename"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 min-w-0">
                      {session.user_name ? (
                        <h3 className={`font-medium truncate text-sm ${isSelected ? "text-primary" : "text-gray-900"}`}>
                          {session.user_name}
                        </h3>
                      ) : (
                        <button
                          type="button"
                          onClick={e => handleCopyPhone(e, session.phone_number)}
                          className={`font-medium truncate text-sm text-left hover:underline decoration-dotted underline-offset-2 ${isSelected ? "text-primary" : "text-gray-900"}`}
                          title="Click to copy phone number"
                        >
                          {formatPhoneNumber(session.phone_number)}
                        </button>
                      )}
                      <button
                        onClick={e => startEdit(e, session)}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
                        aria-label="Rename contact"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Favorite + AI dot */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={e => handleFavorite(e, session)}
                      aria-label={session.is_favorite ? "Remove from favorites" : "Add to favorites"}
                      className="transition-colors"
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          session.is_favorite
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 hover:text-yellow-300 opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </button>
                    <div
                      className={`w-2 h-2 rounded-full ${session.ai_reply_enabled ? "bg-green-500" : "bg-gray-400"}`}
                      title={session.ai_reply_enabled ? "AI Enabled" : "AI Disabled"}
                    />
                  </div>
                </div>

                {/* Phone Number and Template on same row */}
                {(session.user_name || session.last_template_sent) && (
                  <div className="flex items-center gap-2 text-xs mb-1">
                    {session.user_name && (
                      <button
                        type="button"
                        onClick={e => handleCopyPhone(e, session.phone_number)}
                        className="inline-flex items-center gap-1 text-gray-500 hover:text-primary transition-colors group/phone"
                        title="Click to copy phone number"
                      >
                        <span>{formatPhoneNumber(session.phone_number)}</span>
                        <Copy className="h-3 w-3 opacity-0 group-hover/phone:opacity-100 transition-opacity" />
                      </button>
                    )}
                    {session.user_name && session.last_template_sent && (
                      <span className="text-gray-300">|</span>
                    )}
                    {session.last_template_sent && (
                      <span className="text-blue-600 truncate">
                        {session.last_template_sent}
                      </span>
                    )}
                  </div>
                )}

                {/* Notes preview */}
                {session.notes && (
                  <p className="text-xs text-gray-400 italic truncate mb-1">
                    {session.notes.length > 50 ? session.notes.slice(0, 50) + "…" : session.notes}
                  </p>
                )}

                {/* Message Count and Time */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    {session.ai_reply_enabled && <Bot className="h-3 w-3" title="AI Auto-Reply Enabled" />}
                    <span>{session.total_messages_received} messages</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <CallButton
                      phoneNumber={session.phone_number}
                      size="sm"
                      className="hover:text-primary"
                    />
                    <WhatsAppButton
                      phoneNumber={session.phone_number}
                      size="sm"
                      className="hover:text-green-600"
                    />
                    <span className="text-xs text-gray-400 ml-1">{formatRelativeTime(session.last_user_message_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Load More Section */}
      {hasMore && (
        <div 
          ref={loadMoreRef}
          className="p-4 border-b border-gray-100"
        >
          {sessionsError ? (
            <div className="text-center">
              <p className="text-red-500 text-sm mb-2">Failed to load more conversations</p>
              <button
                onClick={onRetry}
                disabled={isFetchingMore}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <button
              ref={loadMoreButtonRef}
              onClick={onLoadMore}
              disabled={isFetchingMore}
              className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed border border-gray-200 rounded-lg text-sm font-medium text-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              {isFetchingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Loading more...
                </>
              ) : (
                <>
                  Load More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      )}
      
      {/* End of data indicator */}
      {!hasMore && filteredSessions.length > 0 && (
        <div className="p-4 text-center text-xs text-gray-400 border-b border-gray-100">
          {sessionsError ? "Failed to load all conversations" : "No more conversations to load"}
        </div>
      )}
    </div>
  );
};

export default ContactList;
