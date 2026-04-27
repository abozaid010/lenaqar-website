"use client";

import ActionsModal from "@/app/(admin)/dashboard/_components/actions-modal";
import ChatHistory from "@/app/(admin)/dashboard/[userId]/_components/chat-history";
import ChatWith from "@/app/(admin)/dashboard/[userId]/_components/chat-with";
import NavigationButtons from "@/app/(admin)/dashboard/[userId]/_components/NavigationButtons";
import SendNewMessageForm from "@/app/(admin)/dashboard/[userId]/_components/send-new-message";
import ToggleReplyType from "@/app/(admin)/dashboard/[userId]/_components/reply-type";
import { useI18n } from "@/hooks/useI18n";
import {
  deleteUser,
  getChatHistory,
  getClientActions,
  resetUnreadMessagesCount,
} from "@/utils/api";
import { handleCopyPhoneNumber } from "@/utils/phone-utils";
import { getActionLabel } from "@/utils/actions";
import { userKeys } from "@/utils/query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleX, Copy, ListPlus, Pencil, Trash2, UserPen } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DASHBOARD_BUTTON, DASHBOARD_ICON_BUTTON } from "@/constants/ui-classes";
import WhatsAppButton from "@/components/ui/whatsapp-button";
import EditRequirementDialog from "./EditRequirementDialog";
import EditUserInfoDialog from "./EditUserInfoDialog";

export default function LeadDetailPane({
  userId,
  leadSummary,
  onInvalidateList,
}) {
  const { t, common, property, localeUtils, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [chatHistory, setChatHistory] = useState([]);
  const [openActionsModal, setOpenActionsModal] = useState(false);
  const [rowActions, setRowActions] = useState(null);
  const [loadingActions, setLoadingActions] = useState(false);
  const [editInfoOpen, setEditInfoOpen] = useState(false);
  const [editReqOpen, setEditReqOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, error, isLoading } = useQuery({
    queryKey: ["chatHistory", userId],
    queryFn: () => getChatHistory(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const onNewMessage = useCallback((newMessage) => {
    setChatHistory((prev) => [...prev, newMessage]);
  }, []);

  useEffect(() => {
    async function resetUnread(uid) {
      await resetUnreadMessagesCount(uid);
    }
    if (!isLoading && data?.data && userId) {
      setChatHistory(data.data.messages || []);
      if (data.data.unread_messages_count !== 0) {
        resetUnread(userId);
      }
    }
  }, [isLoading, data, userId]);

  const phoneNumber =
    data?.data?.phoneNumber ||
    data?.data?.phone_number ||
    leadSummary?.phone_number ||
    null;

  const clientId = data?.data?.client_id;
  const displayName = data?.data?.name || leadSummary?.name || "";

  const clearSelection = useCallback(() => {
    const usp = new URLSearchParams(searchParams.toString());
    usp.delete("userId");
    router.replace(`${window.location.pathname}?${usp.toString()}`, {
      scroll: false,
    });
  }, [router, searchParams]);

  const handleDeleteUser = async () => {
    if (!userId || !clientId) return;
    setIsDeleting(true);
    try {
      await deleteUser(userId, clientId);
      toast.success(common.userDeleted);
      clearSelection();
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.removeQueries({ queryKey: ["chatHistory", userId] });
    } catch (err) {
      toast.error(err?.message || common.operationFailed);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleOpenActions = async () => {
    if (!userId) return;
    setLoadingActions(true);
    try {
      const actions = await getClientActions(userId);
      setRowActions(actions);
      setOpenActionsModal(true);
    } catch (e) {
      console.error(e);
      toast.error(common.operationFailed);
    } finally {
      setLoadingActions(false);
    }
  };

  const handleActionUpdate = (uid, newAction) => {
    onInvalidateList?.();
    queryClient.invalidateQueries({ queryKey: userKeys.all });
  };

  const afterMutation = () => {
    onInvalidateList?.();
    queryClient.invalidateQueries({ queryKey: userKeys.all });
    queryClient.invalidateQueries({ queryKey: ["chatHistory", userId] });
  };

  const lastActionLabel = useMemo(
    () => getActionLabel(leadSummary?.last_action || null, locale),
    [leadSummary?.last_action, locale]
  );

  if (!userId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500 text-sm p-6">
        {common.selectLead}
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
        {common.loadingConversation}
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-red-600 text-sm">
        {error?.message || common.couldNotLoadChat}
        <button
          type="button"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["chatHistory", userId] })}
          className="mt-2 px-3 py-1 bg-primary text-white rounded text-xs"
        >
          {common.retry}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-0 flex-1 bg-white border-l border-gray-100">
        <div className="shrink-0 flex flex-wrap items-center gap-2 px-2 py-1.5 border-b border-gray-200 bg-white gap-y-1">
          <NavigationButtons id={userId} />
          <ChatWith
            name={displayName}
            userId={userId}
            onNameUpdate={() => afterMutation()}
          />
          {clientId === "public" && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
              title={common.deleteUser}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {phoneNumber && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 rounded text-xs">
              <a href={`tel:${phoneNumber}`} className="font-mono text-gray-800">
                {phoneNumber}
              </a>
              <button
                type="button"
                onClick={(e) =>
                  handleCopyPhoneNumber(
                    e,
                    phoneNumber,
                    () => toast.success(t?.common?.copied),
                    () => toast.error(t?.common?.failedToCopyPhone)
                  )
                }
                className="p-0.5"
              >
                <Copy className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <WhatsAppButton
                phoneNumber={phoneNumber}
                className="hover:text-green-600"
                title={common.openWhatsApp}
                ariaLabel={common.whatsapp}
              />
            </div>
          )}

          <div className="flex items-center gap-2 flex-nowrap shrink-0">
            <button
              type="button"
              onClick={() => setEditReqOpen(true)}
              className={`${DASHBOARD_BUTTON} h-10 min-h-[40px]`}
            >
              <Pencil className="w-3 h-3" />
              {common.requirement}
            </button>
            <button
              type="button"
              onClick={() => setEditInfoOpen(true)}
              className={`${DASHBOARD_BUTTON} h-10 min-h-[40px]`}
            >
              <UserPen className="w-3 h-3" />
              {common.contact}
            </button>
            <button
              type="button"
              onClick={handleOpenActions}
              disabled={loadingActions}
              className={`${DASHBOARD_BUTTON} h-10 min-h-[40px]`}
            >
              <ListPlus className="w-3 h-3" />
              {common.actions} · {lastActionLabel}
            </button>

            <ToggleReplyType
              userId={userId}
              clientID={data.data.client_id}
              source={data.data.source || null}
            />
          </div>


        </div>

        {leadSummary?.campaign_ids?.length > 0 && (
          <div className="shrink-0 px-2 py-1 flex flex-wrap gap-1 border-b border-gray-50">
            {leadSummary.campaign_ids.slice(0, 6).map((id) => (
              <span
                key={id}
                className="text-[10px] px-1.5 py-0 rounded bg-blue-50 text-blue-800"
              >
                {id}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col bg-gray-100 rounded-b overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-3">
            <ChatHistory data={chatHistory} />
          </div>
          <SendNewMessageForm userId={userId} onNewMessage={onNewMessage} />
        </div>
      </div>

      {openActionsModal && (
        <ActionsModal
          actions={rowActions}
          userId={userId}
          onClose={() => setOpenActionsModal(false)}
          onActionUpdate={handleActionUpdate}
        />
      )}

      <EditUserInfoDialog
        open={editInfoOpen}
        onClose={() => setEditInfoOpen(false)}
        userId={userId}
        initialName={displayName}
        initialPhone={phoneNumber || ""}
        initialCompany=""
        onSuccess={afterMutation}
      />

      <EditRequirementDialog
        open={editReqOpen}
        onClose={() => setEditReqOpen(false)}
        userId={userId}
        onSuccess={afterMutation}
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full shadow-xl text-sm">
            <p className="font-medium text-gray-900 mb-2">{common.deleteUser}</p>
            <p className="text-gray-600 mb-4">{common.deleteCannotBeUndone}</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 border rounded"
              >
                {common.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-red-600 text-white rounded"
              >
                {isDeleting ? "…" : common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
