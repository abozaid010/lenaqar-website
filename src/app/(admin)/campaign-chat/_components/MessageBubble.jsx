"use client";

import { formatDistanceToNow } from "date-fns";
import { Bot, User } from "lucide-react";

const MessageBubble = ({ message }) => {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isAdmin = message.role === "admin";

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

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
