"use client";

import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bot, User, Send, ToggleLeft, ToggleRight, ArrowLeft } from "lucide-react";
import { SELECTION_COLORS } from "@/constants/colors";
import { LoadingButton, LoadingOverlay } from "@/components/ui/loading-states";
import ErrorBoundary from "@/components/ui/error-boundary";
import MessageBubble from "./MessageBubble";

const ChatPanel = ({ contact, sessionData, loading, onToggleAI, onSendReply, refetchSession }) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionData?.history]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleToggleAI = async () => {
    if (loading || isToggling) return;
    
    // Use sessionData's ai_reply_enabled if available, otherwise fall back to contact
    const currentEnabled = sessionData?.ai_reply_enabled ?? contact.ai_reply_enabled;
    const newEnabled = !currentEnabled;
    
    setIsToggling(true);
    try {
      await onToggleAI(contact.phone_number, newEnabled);
    } catch (error) {
      console.error("Failed to toggle AI:", error);
      // Could show toast notification here
    } finally {
      setIsToggling(false);
    }
  };

  const handleSendReply = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendReply(contact.phone_number, message.trim());
      setMessage("");
      
      // Refetch session to show the new message
      await refetchSession();
    } catch (error) {
      console.error("Failed to send reply:", error);
      // Could show toast notification here
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Use sessionData's ai_reply_enabled if available, otherwise fall back to contact
  const currentAIStatus = sessionData?.ai_reply_enabled ?? contact.ai_reply_enabled;

  const formatPhoneNumber = (phone) => {
    if (!phone) return "Unknown";
    if (phone.startsWith('+') && phone.length > 12 && phone.substring(1).startsWith('20')) {
      return `+20 ${phone.substring(3, 6)} ${phone.substring(6, 9)} ${phone.substring(9, 13)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-gray-500">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center">
              {sessionData?.user_name ? (
                <span className="text-sm font-medium">
                  {sessionData.user_name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {sessionData?.user_name || formatPhoneNumber(contact.phone_number)}
              </h2>
              {sessionData?.user_name && (
                <p className="text-sm text-gray-500">
                  {formatPhoneNumber(contact.phone_number)}
                </p>
              )}
            </div>
          </div>

          {/* AI Toggle */}
          <LoadingButton
            onClick={handleToggleAI}
            isLoading={isToggling}
            loadingText="Switching..."
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentAIStatus
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {currentAIStatus ? (
              <>
                <ToggleRight className="h-4 w-4" />
                AI On
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4" />
                AI Off
              </>
            )}
          </LoadingButton>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {sessionData?.history?.length > 0 ? (
          <>
            {sessionData.history.map((msg, index) => (
              <MessageBubble key={index} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">
                {currentAIStatus 
                  ? "AI replies are enabled. Messages will appear here."
                  : "Send a message to start the conversation."
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white relative">
        <LoadingOverlay isVisible={isSending} message="Sending message..." />
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isSending}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <LoadingButton
            onClick={handleSendReply}
            isLoading={isSending}
            loadingText="Sending..."
            disabled={!message.trim() || isSending}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              message.trim() && !isSending
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send
              </>
            )}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
