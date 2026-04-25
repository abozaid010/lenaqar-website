"use client";

import { Bot, User } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { useLocaleConstants } from "@/utils/localeConstants";

const MessageBubble = ({ message }) => {
  const { locale } = useI18n();
  const { formatRelativeTime } = useLocaleConstants();
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isAdmin = message.role === "admin";

  const formatMessageContent = (content) => {
    if (!content) return "";
    
    // Handle URLs and make them clickable
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Only show template tag for admin messages that have template_name
  const showTemplateTag = isAdmin && message.template_name;

  if (!isUser && !isAssistant && !isAdmin) {
    return null;
  }

  // Admin and Assistant messages should appear on the right, User messages on the left
  const isRightSide = isAssistant || isAdmin;

  return (
    <div className={`flex ${isRightSide ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex gap-3 max-w-[70%] ${isRightSide ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser 
            ? "bg-gray-200 text-gray-600" 
            : isAssistant
            ? "bg-primary text-white"
            : "bg-blue-500 text-white"
        }`}>
          {isUser ? (
            <User className="h-4 w-4" />
          ) : isAssistant ? (
            <Bot className="h-4 w-4" />
          ) : (
            <span className="text-xs font-bold">A</span>
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isRightSide ? "items-end" : "items-start"}`}>
          {/* Template Tag */}
          {showTemplateTag && (
            <div className="mb-2 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-mono flex items-center gap-1">
              <span>Tag</span>
              {message.template_name}
              {message.language_code && (
                <span className="text-xs bg-slate-200 px-1 rounded">[{message.language_code}]</span>
              )}
            </div>
          )}

          {/* Role Label for non-user messages */}
          {!isUser && (
            <span className={`text-xs mb-1 px-2 ${
              isAssistant 
                ? "text-purple-600" 
                : "text-blue-600"
            }`}>
              {isAssistant ? "AI Assistant" : "Admin"}
            </span>
          )}

          {/* Image */}
          {message.image_url && (
            <img 
              src={message.image_url} 
              alt="Message media" 
              className="max-w-[200px] max-h-[200px] rounded-lg mb-2 object-cover"
            />
          )}

          {/* Bubble */}
          <div
            className={`px-4 py-2 rounded-2xl ${
              isUser
                ? "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                : isAssistant
                ? "bg-primary text-white rounded-tr-sm"
                : "bg-blue-500 text-white rounded-tr-sm"
            }`}
          >
            <p className={`text-sm whitespace-pre-wrap break-words ${
              isUser ? "text-gray-800" : "text-white"
            }`}>
              {formatMessageContent(message.content)}
            </p>
          </div>

          {/* Timestamp */}
          {message.timestamp && (
            <span className={`text-xs text-gray-400 mt-1 px-1 ${
              isRightSide ? "text-right" : "text-left"
            }`}>
              {formatTime(message.timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
