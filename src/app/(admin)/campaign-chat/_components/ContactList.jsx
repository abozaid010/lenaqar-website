"use client";

import { useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bot, User, MessageCircle, Star, Pencil, Check, X } from "lucide-react";
import { SELECTION_COLORS } from "@/constants/colors";
import { ContactListSkeleton } from "@/components/ui/loading-states";

const ContactList = ({ sessions, selectedContact, onContactSelect, loading, onRename, onToggleFavorite, sessionDetails }) => {
  const [editingPhone, setEditingPhone] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("all");
  const inputRef = useRef(null);

  // Derive all distinct template names from loaded session details
  const allTemplates = sessionDetails 
    ? [...new Set(
        Object.values(sessionDetails)
          .flatMap(session => 
            (session.history ?? [])
              .filter(entry => entry.template_name)
              .map(entry => entry.template_name)
          )
      )]
    : [];

  // Filter sessions based on selected template
  const filteredSessions = selectedTemplate === "all" 
    ? sessions 
    : sessions.filter(session => {
        const details = sessionDetails?.[session.phone_number];
        return details?.history?.some(entry => entry.template_name === selectedTemplate);
      });

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

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "No messages";
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
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
      await onRename?.(session.phone_number, trimmed);
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
                      <h3 className={`font-medium truncate text-sm ${isSelected ? "text-primary" : "text-gray-900"}`}>
                        {session.user_name || formatPhoneNumber(session.phone_number)}
                      </h3>
                      <button
                        onClick={e => startEdit(e, session)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 flex-shrink-0 transition-opacity"
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

                {/* Phone Number (when name exists) */}
                {session.user_name && (
                  <p className="text-xs text-gray-500 mb-1">{formatPhoneNumber(session.phone_number)}</p>
                )}

                {/* Notes preview */}
                {session.notes && (
                  <p className="text-xs text-gray-400 italic truncate mb-1">
                    {session.notes.length > 50 ? session.notes.slice(0, 50) + "…" : session.notes}
                  </p>
                )}

                {/* Message Count and Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    {session.ai_reply_enabled && <Bot className="h-3 w-3" title="AI Auto-Reply Enabled" />}
                    <span>{session.total_messages_received} messages</span>
                  </div>
                  <span className="text-xs text-gray-400">{getRelativeTime(session.last_user_message_at)}</span>
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
