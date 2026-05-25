"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot, User, Send, ToggleLeft, ToggleRight,
  Star, Pencil, Check, X, StickyNote, Trash2, Save, Copy
} from "lucide-react";
import toast from "react-hot-toast";
import { LoadingButton, LoadingOverlay } from "@/components/ui/loading-states";
import WhatsAppButton from "@/components/ui/whatsapp-button";
import CallButton from "@/components/ui/call-button";
import { handleCopyFullPhoneNumber } from "@/utils/phone-utils";
import MessageBubble from "./MessageBubble";
import { useI18n } from "@/hooks/useI18n";
import { normalizeCampaignPhoneParam } from "@/utils/campaign-chat-session";

const NOTES_MAX_LENGTH = 500;

const DEFAULT_WHATSAPP_MESSAGE = `بعد مكالمتنا، حابب أسيب لك ملخص سريع يساعدك تبدأ فورًا 👇

• نظام إدارة عملاء (CRM) ينظملك كل شغلك في مكان واحد
• مساعد ذكي (AI) يرد على العملاء بدل ما تضيع وقتك في الرسائل
• تحديث مستمر للوحدات علشان تبقى دايمًا جاهز
• نشر مجاني لحد 50 وحدة ريسيل وتبدأ تجيب عملاء

ابدأ دلوقتي:
[حمّل التطبيق](https://lenaai.net/download?utm_campaign=spring_offer&utm_source=chatgpt.com)

وجرّب بنفسك الفرق من أول يوم.`;

const ChatPanel = ({
  contact,
  sessionData,
  loading,
  sessionError,
  onRetrySession,
  onToggleAI,
  onSendReply,
  refetchSession,
  onRename,
  onToggleFavorite,
  onUpdateNotes,
}) => {
  const { t, translate } = useI18n();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Inline rename state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef(null);

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Notes state
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [notesDraft, setNotesDraft] = useState(""); // what user is currently typing
  const [notesEditing, setNotesEditing] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const sessionPhone = sessionData?.phone_number
    ? normalizeCampaignPhoneParam(sessionData.phone_number)
    : "";
  const contactPhone = contact?.phone_number
    ? normalizeCampaignPhoneParam(contact.phone_number)
    : "";
  const sessionMatchesContact =
    !sessionPhone || !contactPhone || sessionPhone === contactPhone;
  const history =
    sessionMatchesContact && Array.isArray(sessionData?.history)
      ? sessionData.history
      : [];

  // Sync favorite from sessionData/contact when contact changes
  useEffect(() => {
    const src = sessionData ?? contact;
    setIsFavorite(!!src?.is_favorite);
  }, [sessionData?.phone_number, contact?.phone_number]);

  // Sync notes whenever sessionData loads or updates (including initial load)
  useEffect(() => {
    const loaded = sessionData?.notes ?? contact?.notes ?? "";
    setNotesValue(loaded);
    setNotesDraft(loaded);
    setNotesEditing(false);
    setNotesSaved(false);
  }, [sessionData?.notes, sessionData?.phone_number, contact?.phone_number]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [message]);

  const handleToggleAI = async () => {
    if (loading || isToggling) return;
    const currentEnabled = sessionData?.ai_reply_enabled ?? contact.ai_reply_enabled;
    setIsToggling(true);
    try {
      await onToggleAI(contact.phone_number, !currentEnabled);
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
      await refetchSession();
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // --- Rename ---
  const startEditName = () => {
    const current = sessionData?.user_name ?? contact?.user_name ?? "";
    setNameValue(current);
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const commitName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) { setIsEditingName(false); return; }
    const current = sessionData?.user_name ?? contact?.user_name ?? "";
    if (trimmed === current) { setIsEditingName(false); return; }
    setIsSavingName(true);
    try {
      await onRename?.(contact.phone_number, trimmed);
      setIsEditingName(false);
    } catch {
      // Rename failed; keep the input open so the user can retry.
    } finally {
      setIsSavingName(false);
    }
  };

  const cancelName = () => setIsEditingName(false);

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); commitName(); }
    if (e.key === "Escape") cancelName();
  };

  // --- Favorite ---
  const handleToggleFavorite = async () => {
    if (isTogglingFavorite) return;
    const next = !isFavorite;
    setIsFavorite(next); // optimistic
    setIsTogglingFavorite(true);
    try {
      await onToggleFavorite?.(contact.phone_number, next);
    } catch {
      setIsFavorite(!next); // revert
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // --- Notes ---
  const handleNotesDraftChange = (e) => {
    setNotesDraft(e.target.value.slice(0, NOTES_MAX_LENGTH));
    setNotesSaved(false);
  };

  const startEditNotes = () => {
    setNotesDraft(notesValue);
    setNotesEditing(true);
    setNotesSaved(false);
  };

  const cancelEditNotes = () => {
    setNotesDraft(notesValue);
    setNotesEditing(false);
    setNotesSaved(false);
  };

  const saveNotes = async (val) => {
    setIsSavingNotes(true);
    try {
      await onUpdateNotes?.(contact.phone_number, val || null);
      setNotesValue(val ?? "");
      setNotesDraft(val ?? "");
      setNotesEditing(false);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch {
      // Keep the editor open with the user's draft so they can retry.
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSaveNotes = () => saveNotes(notesDraft);

  const handleClearNotes = async () => {
    setNotesDraft("");
    await saveNotes(null);
  };

  const handleCopyPhone = (e) => {
    handleCopyFullPhoneNumber(
      e,
      contact?.phone_number,
      () => toast.success(t?.common?.phoneCopied),
      () => toast.error(t?.common?.failedToCopyPhone)
    );
  };

  const currentAIStatus = sessionData?.ai_reply_enabled ?? contact.ai_reply_enabled;
  const displayName = sessionData?.user_name ?? contact?.user_name;

  const formatPhoneNumber = (phone) => {
    if (!phone) return "Unknown";
    if (phone.startsWith("+") && phone.length > 12 && phone.substring(1).startsWith("20")) {
      return `+20 ${phone.substring(3, 6)} ${phone.substring(6, 9)} ${phone.substring(9, 13)}`;
    }
    return phone;
  };

  if (loading && !sessionData) {
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
            <p className="text-gray-500">
              {translate(
                "campaignChat.loadingConversation",
                t?.campaignChat?.loadingConversation
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (sessionError && !sessionData) {
    const errMsg =
      sessionError?.response?.data?.error_message ||
      sessionError?.message ||
      translate(
        "campaignChat.failedToLoadConversation",
        t?.campaignChat?.failedToLoadConversation
      );

    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
          <div className="text-center max-w-md">
            <Bot className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-600 font-medium mb-2">{errMsg}</p>
            <button
              type="button"
              onClick={() => onRetrySession?.()}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
            >
              {translate("common.retry", t?.common?.retry)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="p-4 flex items-center justify-between gap-3">
          {/* Avatar + Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0">
              {displayName ? (
                <span className="text-sm font-medium">{displayName.charAt(0).toUpperCase()}</span>
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              {/* Inline rename */}
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    onBlur={commitName}
                    disabled={isSavingName}
                    className="text-sm font-semibold border-b border-primary focus:outline-none bg-transparent w-40"
                  />
                  {isSavingName ? (
                    <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <button onMouseDown={e => { e.preventDefault(); commitName(); }} aria-label="Save name" className="text-green-600 hover:text-green-700">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onMouseDown={e => { e.preventDefault(); cancelName(); }} aria-label="Cancel" className="text-gray-400 hover:text-gray-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <h2
                    onClick={startEditName}
                    className="font-semibold text-gray-900 truncate cursor-pointer hover:text-primary transition-colors"
                    title="Click to rename"
                  >
                    {displayName || formatPhoneNumber(contact.phone_number)}
                  </h2>
                  <button
                    onClick={startEditName}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    aria-label="Rename contact"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {displayName && (
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors group/phone"
                  title="Click to copy phone number"
                >
                  <span>{formatPhoneNumber(contact.phone_number)}</span>
                  <Copy className="h-3 w-3 opacity-0 group-hover/phone:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Call */}
            <CallButton
              phoneNumber={contact?.phone_number}
              className="hover:text-primary"
            />

            {/* WhatsApp */}
            <WhatsAppButton
              phoneNumber={contact?.phone_number}
              className="hover:text-green-600"
              options={{ message: DEFAULT_WHATSAPP_MESSAGE }}
              title="Open WhatsApp with default message"
              onMessageCopied={(success) => {
                if (success) {
                  toast.success(
                    "Message copied — if WhatsApp doesn't pre-fill it, just paste (Cmd/Ctrl+V).",
                    { duration: 5000 }
                  );
                } else {
                  toast.error("Couldn't copy the message to clipboard.");
                }
              }}
            />

            {/* Favorite */}
            <button
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400 hover:text-yellow-300"
                }`}
              />
            </button>

            {/* Notes toggle */}
            <button
              onClick={() => setNotesOpen(o => !o)}
              aria-label="Toggle notes"
              className={`relative p-1.5 rounded-full hover:bg-gray-100 transition-colors ${notesOpen ? "text-primary" : "text-gray-400"}`}
            >
              <StickyNote className="h-5 w-5" />
              {notesValue && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-yellow-400 rounded-full" />
              )}
            </button>

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
                <><ToggleRight className="h-4 w-4" />AI On</>
              ) : (
                <><ToggleLeft className="h-4 w-4" />AI Off</>
              )}
            </LoadingButton>
          </div>
        </div>

        {/* Notes panel */}
        {notesOpen && (
          <div className="px-4 pb-3 border-t border-gray-100 bg-gray-50">
            <div className="pt-3">
              {/* Header row */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <StickyNote className="h-3.5 w-3.5" /> Notes
                </span>
                <div className="flex items-center gap-2">
                  {notesSaved && !isSavingNotes && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Saved
                    </span>
                  )}
                  {!notesEditing && notesValue && (
                    <button
                      onClick={handleClearNotes}
                      disabled={isSavingNotes}
                      className="text-xs text-red-400 hover:text-red-600 flex items-center gap-0.5 disabled:opacity-50"
                      aria-label="Clear notes"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  )}
                  {!notesEditing && (
                    <button
                      onClick={startEditNotes}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5"
                      aria-label="Edit notes"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Read mode */}
              {!notesEditing ? (
                <div
                  onClick={startEditNotes}
                  className="min-h-[60px] text-sm text-gray-700 bg-white border border-gray-200 rounded-md px-3 py-2 cursor-text whitespace-pre-wrap"
                >
                  {notesValue || (
                    <span className="text-gray-400 italic">No notes yet. Click Edit to add notes.</span>
                  )}
                </div>
              ) : (
                /* Edit mode */
                <div>
                  <textarea
                    value={notesDraft}
                    onChange={handleNotesDraftChange}
                    placeholder="Add notes about this contact..."
                    rows={4}
                    autoFocus
                    className="w-full text-sm border border-primary rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400">{notesDraft.length}/{NOTES_MAX_LENGTH}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={cancelEditNotes}
                        disabled={isSavingNotes}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 bg-white disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="text-xs text-white bg-primary hover:bg-primary/90 px-3 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                      >
                        {isSavingNotes ? (
                          <>
                            <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3" /> Save
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {history.length > 0 ? (
          <>
            {history.map((msg, index) => (
              <MessageBubble key={`${msg.timestamp || "t"}-${index}`} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                {translate("campaignChat.noMessages", t?.campaignChat?.noMessages)}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {currentAIStatus
                  ? translate(
                      "campaignChat.noMessagesAiOn",
                      t?.campaignChat?.noMessagesAiOn
                    )
                  : translate(
                      "campaignChat.noMessagesStart",
                      t?.campaignChat?.noMessagesStart
                    )}
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
            style={{ minHeight: "40px", maxHeight: "120px" }}
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
