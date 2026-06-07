"use client";

import ActionsModal from "@/app/(admin)/dashboard/_components/actions-modal";
import NewActionForm from "@/app/(admin)/dashboard/_components/new-action-form";
import ChatHistory from "@/app/(admin)/dashboard/[userId]/_components/chat-history";
import ChatWith from "@/app/(admin)/dashboard/[userId]/_components/chat-with";
import SendNewMessageForm from "@/app/(admin)/dashboard/[userId]/_components/send-new-message";
import EditRequirementDialog from "@/app/(admin)/dashboard/_components/split-view/EditRequirementDialog";
import LeadDetailTabs from "@/app/(admin)/dashboard/_components/split-view/LeadDetailTabs";
import TagChip from "@/components/ui/tag-chip";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { phoneToE164 } from "@/components/phone/phone-utils";
import { DASHBOARD_BUTTON } from "@/constants/ui-classes";
import { useI18n } from "@/hooks/useI18n";
import { getActionLabel } from "@/utils/actions";
import { formatCurrency } from "@/utils/formatters";
import {
  addLeadTags,
  getChatHistory,
  getClientActions,
  getClientRequirements,
  removeLeadTags,
  resetUnreadMessagesCount,
} from "@/utils/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  ListPlus,
  MessageCircle,
  Pencil,
  Plus,
  Settings2,
  UserCircle2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const VALID_TABS = new Set(["conversations", "requirements", "actions"]);
const DEFAULT_TAB = "conversations";

const pickLast = (v) => (Array.isArray(v) ? v[v.length - 1] : v);

const isMeaningfulString = (v) => {
  if (v == null) return false;
  const s = String(v).trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  return lower !== "n/a" && lower !== "not defined" && lower !== "none";
};

function buildSimpleRequirementLines(requirements) {
  if (!requirements || requirements.error) return [];
  const lines = [];
  const push = (label, value) => {
    if (!isMeaningfulString(value) && value !== 0) return;
    lines.push({ label, value: String(value).trim() });
  };
  push("Building", pickLast(requirements.buildingType));
  push("City", requirements.city);
  push("District", requirements.district);
  push("Project", requirements.project);
  if (requirements.roomsCount) push("Rooms", requirements.roomsCount);
  if (requirements.totalPrice) push("Budget", formatCurrency(requirements.totalPrice));
  return lines;
}

export default function ScheduleUserDetailsDialog({
  isOpen,
  onClose,
  appointment,
  onDataChanged,
}) {
  const { t, translate, common, locale } = useI18n();
  const closeLabel = translate("schaduall.dialogClose");
  const closeAriaLabel = translate("schaduall.dialogCloseAriaLabel");
  const queryClient = useQueryClient();

  const userId =
    appointment?.user_id ?? appointment?.userId ?? null;

  const leadSummary = useMemo(
    () => ({
      name: appointment?.name || "",
      phone_number: appointment?.phone_number || "",
      last_action: appointment?.action || null,
      tags: appointment?.tags || [],
      company_name: appointment?.company_name,
      requirement_name: appointment?.requirement_name,
    }),
    [appointment]
  );

  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
  const [chatHistory, setChatHistory] = useState([]);
  const [openActionsModal, setOpenActionsModal] = useState(false);
  const [rowActions, setRowActions] = useState(null);
  const [loadingActions, setLoadingActions] = useState(false);
  const [editReqOpen, setEditReqOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(DEFAULT_TAB);
  }, [isOpen, userId]);

  const { data, error, isLoading } = useQuery({
    queryKey: ["chatHistory", userId],
    queryFn: () => getChatHistory(userId),
    enabled: isOpen && !!userId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const { data: requirements } = useQuery({
    queryKey: ["requirements", userId],
    queryFn: () => getClientRequirements(userId),
    enabled: isOpen && !!userId,
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

  const phoneE164ForLinks = phoneNumber
    ? phoneToE164(phoneNumber, "EG") || phoneNumber
    : null;

  const displayName = data?.data?.name || leadSummary?.name || "";

  const afterMutation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["chatHistory", userId] });
    queryClient.invalidateQueries({ queryKey: ["requirements", userId] });
    onDataChanged?.();
  }, [queryClient, userId, onDataChanged]);

  const tags = useMemo(() => {
    const fromChat = data?.data?.tags;
    if (Array.isArray(fromChat) && fromChat.length > 0) return fromChat;
    return leadSummary?.tags || [];
  }, [data, leadSummary?.tags]);

  const requirementLines = useMemo(
    () => buildSimpleRequirementLines(requirements),
    [requirements]
  );

  const lastActionLabel = useMemo(
    () =>
      getActionLabel(
        leadSummary?.last_action || appointment?.action || null,
        locale
      ),
    [leadSummary?.last_action, appointment?.action, locale]
  );

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

  const handleAddTag = async (e) => {
    e.preventDefault();
    const tagValue = newTagInput.trim();
    if (!tagValue || !userId) return;

    const isDuplicate = tags.some(
      (tag) => tag.toLowerCase() === tagValue.toLowerCase()
    );
    if (isDuplicate) {
      toast.error(translate("leadDetail.actionsTab.tagExists"));
      setNewTagInput("");
      return;
    }

    setIsAddingTag(true);
    try {
      const result = await addLeadTags(userId, [tagValue]);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(translate("leadDetail.actionsTab.tagAdded"));
        setNewTagInput("");
        afterMutation();
      }
    } catch (err) {
      toast.error(err?.message || common.operationFailed);
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    if (!userId) return;
    try {
      const result = await removeLeadTags(userId, [tagToRemove]);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(translate("leadDetail.actionsTab.tagRemoved"));
        afterMutation();
      }
    } catch (err) {
      toast.error(err?.message || common.operationFailed);
    }
  };

  const tabItems = [
    {
      id: "conversations",
      label: translate("leadDetail.tabs.conversations"),
      icon: MessageCircle,
    },
    {
      id: "requirements",
      label: translate("leadDetail.tabs.requirements"),
      icon: FileText,
    },
    {
      id: "actions",
      label: translate("leadDetail.tabs.actions"),
      icon: Settings2,
    },
  ];

  const dialogTitle =
    displayName ||
    translate("schaduall.userDetailsTitle");

  const renderBody = () => {
    if (!userId) {
      return (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-500 text-center">
          {translate("schaduall.cannotOpenDetailsMissingUser")}
        </div>
      );
    }

    if (isLoading && !data) {
      return (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-500">
          {common.loadingConversation}
        </div>
      );
    }

    if (error || !data?.data) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-red-600 text-sm gap-2">
          <p>{error?.message || common.couldNotLoadChat}</p>
          <button
            type="button"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["chatHistory", userId] })
            }
            className="px-3 py-1 bg-primary text-white rounded text-xs"
          >
            {common.retry}
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col min-h-0 flex-1 bg-white">
        <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-white">
          <div className="flex-1 min-w-0">
            <ChatWith
              name={displayName}
              userId={userId}
              onNameUpdate={() => afterMutation()}
            />
          </div>
        </div>

        <LeadDetailTabs
          value={activeTab}
          onChange={(tab) => {
            if (VALID_TABS.has(tab)) setActiveTab(tab);
          }}
          tabs={tabItems}
          ariaLabel={translate("leadDetail.tabs.ariaLabel")}
        />

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {activeTab === "conversations" && (
            <div className="flex-1 min-h-0 flex flex-col bg-gray-100 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 max-h-[50vh]">
                <ChatHistory data={chatHistory} />
              </div>
              <SendNewMessageForm
                userId={userId}
                phoneNumber={phoneNumber}
                clientId={data?.data?.client_id}
                onNewMessage={onNewMessage}
              />
            </div>
          )}

          {activeTab === "requirements" && (
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-gray-50/40 max-h-[55vh]">
              <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <UserCircle2 className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {translate("leadDetail.requirementSummary.title")}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditReqOpen(true)}
                        className="shrink-0 inline-flex items-center gap-1 text-xs text-primary hover:bg-primary/5 px-2 py-1 rounded transition-colors"
                      >
                        {requirementLines.length > 0 ? (
                          <Pencil className="w-3.5 h-3.5" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {requirementLines.length > 0
                            ? translate("common.edit", common.edit)
                            : translate("leadDetail.requirementSummary.addAction")}
                        </span>
                      </button>
                    </div>
                    {requirementLines.length > 0 ? (
                      <ul className="space-y-1.5 text-sm text-gray-800">
                        {requirementLines.map(({ label, value }) => (
                          <li key={label} className="flex gap-2">
                            <span className="text-gray-500 shrink-0">
                              {label}:
                            </span>
                            <span className="font-medium break-words">
                              {value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {translate("leadDetail.requirementSummary.empty")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "actions" && (
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50/40 max-h-[55vh]">
              {appointment?.comment?.trim() ? (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <h5 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {translate("schaduall.scheduledTaskNote")}
                  </h5>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {appointment.comment.trim()}
                  </p>
                </div>
              ) : null}

              <section className="rounded-lg border border-gray-200 bg-white p-3">
                <h5 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {translate("leadDetail.actionsTab.sections.tags")}
                </h5>
                <div className="space-y-2">
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {tags.map((tag, index) => (
                        <TagChip
                          key={`${tag}-${index}`}
                          label={tag}
                          size="xs"
                          removable
                          onRemove={() => handleRemoveTag(tag)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {translate("leadDetail.actionsTab.noTags")}
                    </p>
                  )}
                  <form onSubmit={handleAddTag} className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder={translate("clientsTable.tags.addPlaceholder")}
                      className="flex-1 min-w-[140px] px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      disabled={isAddingTag}
                    />
                    <button
                      type="submit"
                      disabled={!newTagInput.trim() || isAddingTag}
                      className="px-3 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isAddingTag
                        ? "..."
                        : translate("clientsTable.tags.addButton")}
                    </button>
                  </form>
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-3">
                <h5 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {translate("leadDetail.actionsTab.sections.actionsLog")}
                </h5>
                <button
                  type="button"
                  onClick={handleOpenActions}
                  disabled={loadingActions}
                  className={`${DASHBOARD_BUTTON} h-9 min-h-[36px] text-xs w-full sm:w-auto mb-3`}
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  {common.actions} · {lastActionLabel}
                </button>
                <NewActionForm
                  userId={String(userId)}
                  phoneNumber={phoneE164ForLinks || phoneNumber || ""}
                  name={displayName}
                  defaultAction={appointment?.action || null}
                  defaultComment={appointment?.comment ?? ""}
                  onSuccess={afterMutation}
                />
              </section>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <UnifiedDialog
        isOpen={isOpen}
        onClose={onClose}
        title={dialogTitle}
        headerVariant="unified"
        cancelLabel={closeLabel}
        cancelAriaLabel={closeAriaLabel}
        headerTrailing={null}
        bodyClassName="p-0 flex flex-col min-h-[70vh] max-h-[85vh]"
      >
        {renderBody()}
      </UnifiedDialog>

      {openActionsModal && userId ? (
        <ActionsModal
          actions={rowActions}
          userId={userId}
          phoneNumber={phoneE164ForLinks || phoneNumber || ""}
          name={displayName || ""}
          onClose={() => setOpenActionsModal(false)}
          onActionUpdate={() => afterMutation()}
          overlayClassName="z-[70]"
        />
      ) : null}

      {userId ? (
        <EditRequirementDialog
          open={editReqOpen}
          onClose={() => setEditReqOpen(false)}
          userId={userId}
          onSuccess={afterMutation}
        />
      ) : null}
    </>
  );
}
