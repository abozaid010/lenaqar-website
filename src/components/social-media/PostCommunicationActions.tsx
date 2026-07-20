"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Loader2, MessageCircle, Phone } from "lucide-react";
import toast from "react-hot-toast";

import ChatConversation from "@/components/chat/chat-conversation";
import PhoneTelLink from "@/components/phone/PhoneTelLink";
import ActionButton from "@/components/ui/action-button";
import { useI18n } from "@/hooks/useI18n";
import { getClientid } from "@/utils/api";
import { copyToClipboard } from "@/utils/phone-utils";
import { extractPhoneFromText } from "@/utils/extract-phone-from-text";
import { findOrCreateLeadByPhone } from "@/lib/social-media/find-or-create-lead-by-phone";
import {
  ACTION_BUTTON_BASE,
  ACTION_BUTTON_SIZES,
  ACTION_BUTTON_VARIANTS,
} from "@/constants/ui-classes";

type ChatTarget = {
  userId: string;
  phoneNumber: string;
  name: string;
};

const HANDLED_BUTTON_CLASS =
  "!bg-emerald-50 !border-emerald-300 !text-emerald-800 hover:!bg-emerald-100 hover:!border-emerald-400 focus-visible:!ring-emerald-400/40";

/**
 * Copy / Call / WhatsApp actions for post content.
 * WhatsApp opens the existing ChatConversation panel (not WhatsApp Web).
 *
 * Phone resolution: prefer API `phoneNumber`, fallback to local extractPhoneFromText.
 * When Call or WhatsApp succeeds, invoke `onHandled` so the parent can mark reviewed.
 */
export function PostCommunicationActions({
  postContent,
  phoneNumber = null,
  isReviewed = false,
  onHandled,
  className = "",
}: {
  postContent: string;
  /** E.164 from API when available. */
  phoneNumber?: string | null;
  isReviewed?: boolean;
  /** Fired after Call click or successful WhatsApp open (marks lead handled). */
  onHandled?: () => void | Promise<void>;
  className?: string;
}) {
  const { translate } = useI18n();
  const phone = useMemo(() => {
    const fromApi = String(phoneNumber ?? "").trim();
    if (fromApi) return fromApi;
    return extractPhoneFromText(postContent);
  }, [phoneNumber, postContent]);
  const hasPhone = Boolean(phone);
  const noPhoneTitle = translate(
    "socialMedia.actions.noPhoneFound",
    "No phone number found.",
  );

  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [isMarkingHandled, setIsMarkingHandled] = useState(false);
  const openingLockRef = useRef(false);

  const clientId = getClientid() || undefined;
  const buttonSize = ACTION_BUTTON_SIZES.md;
  const contactClassName = isReviewed
    ? `${ACTION_BUTTON_BASE} ${HANDLED_BUTTON_CLASS} ${buttonSize.box}`
    : `${ACTION_BUTTON_BASE} ${ACTION_BUTTON_VARIANTS.default} ${buttonSize.box}`;

  const markHandled = async () => {
    if (!onHandled || isReviewed || isMarkingHandled) return;
    setIsMarkingHandled(true);
    try {
      await onHandled();
    } catch (error) {
      console.error("Failed to mark post handled:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : translate("common.operationFailed"),
      );
    } finally {
      setIsMarkingHandled(false);
    }
  };

  const handleCopyPost = async () => {
    const text = String(postContent ?? "").trim();
    if (!text) {
      toast.error(
        translate(
          "socialMedia.actions.copyPostEmpty",
          "Nothing to copy.",
        ),
      );
      return;
    }
    await copyToClipboard(
      text,
      () =>
        toast.success(
          translate("socialMedia.actions.copyPostSuccess", "Post copied"),
        ),
      () => toast.error(translate("common.operationFailed")),
    );
  };

  const handleWhatsApp = async () => {
    if (!phone) {
      toast.error(noPhoneTitle);
      return;
    }
    if (openingLockRef.current || isOpeningChat) return;

    openingLockRef.current = true;
    setIsOpeningChat(true);
    try {
      const lead = await findOrCreateLeadByPhone(phone);
      setChatTarget({
        userId: lead.userId,
        phoneNumber: lead.phoneNumber,
        name: lead.name,
      });
      toast.success(
        lead.created
          ? translate(
              "socialMedia.actions.leadCreatedChat",
              "Lead created. Chat opened.",
            )
          : translate(
              "socialMedia.actions.chatOpened",
              "Chat opened.",
            ),
      );
      await markHandled();
    } catch (error) {
      console.error("Failed to open post WhatsApp chat:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : translate("common.operationFailed"),
      );
    } finally {
      openingLockRef.current = false;
      setIsOpeningChat(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()}>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <ActionButton
          size="md"
          icon={Copy}
          onClick={handleCopyPost}
          title={translate("socialMedia.actions.copyPost", "Copy Post")}
          ariaLabel={translate("socialMedia.actions.copyPost", "Copy Post")}
        >
          {translate("socialMedia.actions.copyPost", "Copy Post")}
        </ActionButton>

        {hasPhone ? (
          <PhoneTelLink
            phoneNumber={phone}
            className={contactClassName}
            title={translate("buttons.call", "Call")}
            aria-label={translate("buttons.call", "Call")}
            stopPropagation
            onClick={() => {
              void markHandled();
            }}
          >
            <Phone className={buttonSize.icon} strokeWidth={1.75} aria-hidden />
            <span className="whitespace-nowrap">
              {translate("buttons.call", "Call")}
            </span>
          </PhoneTelLink>
        ) : (
          <button
            type="button"
            disabled
            className={`${contactClassName} opacity-50 cursor-not-allowed`}
            title={noPhoneTitle}
            aria-label={translate("buttons.call", "Call")}
          >
            <Phone className={buttonSize.icon} strokeWidth={1.75} aria-hidden />
            <span className="whitespace-nowrap">
              {translate("buttons.call", "Call")}
            </span>
          </button>
        )}

        {hasPhone ? (
          <ActionButton
            size="md"
            icon={isOpeningChat ? Loader2 : MessageCircle}
            disabled={isOpeningChat}
            onClick={handleWhatsApp}
            title={translate("buttons.whatsapp", "WhatsApp")}
            ariaLabel={translate("buttons.whatsapp", "WhatsApp")}
            className={`${isOpeningChat ? "[&_svg]:animate-spin" : ""} ${
              isReviewed ? HANDLED_BUTTON_CLASS : ""
            }`.trim()}
          >
            {isOpeningChat
              ? translate("common.loading", "Loading...")
              : translate("buttons.whatsapp", "WhatsApp")}
          </ActionButton>
        ) : (
          <button
            type="button"
            disabled
            className={`${contactClassName} opacity-50 cursor-not-allowed`}
            title={noPhoneTitle}
            aria-label={translate("buttons.whatsapp", "WhatsApp")}
          >
            <MessageCircle className={buttonSize.icon} strokeWidth={1.75} aria-hidden />
            <span className="whitespace-nowrap">
              {translate("buttons.whatsapp", "WhatsApp")}
            </span>
          </button>
        )}
      </div>

      {chatTarget ? (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="px-3 py-2 border-b border-gray-100 shrink-0">
            <div className="text-xs font-semibold text-gray-600">
              {translate("socialMedia.actions.chatWith", "Chat")}
            </div>
            <div className="text-sm font-semibold text-gray-900 truncate">
              {chatTarget.name}
            </div>
            <div className="text-xs text-gray-500" dir="ltr">
              {chatTarget.phoneNumber}
            </div>
          </div>
          <ChatConversation
            userId={chatTarget.userId}
            phoneNumber={chatTarget.phoneNumber}
            clientId={clientId}
            compact
            fillHeight
            className="flex-1 min-h-0"
          />
        </div>
      ) : null}
    </div>
  );
}
