"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { PhoneField } from "@/components/phone/PhoneField";
import { phoneToE164 } from "@/components/phone/phone-utils";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import { useI18n } from "@/hooks/useI18n";
import {
  DEFAULT_WHATSAPP_AGENT,
  resolveWhatsappAgent,
  WHATSAPP_AGENT_OPTIONS,
} from "@/constants/whatsapp-agents";
import {
  DEFAULT_WHATSAPP_MESSAGING_PROVIDER,
  WHATSAPP_MESSAGING_PROVIDERS,
} from "@/constants/whatsapp-messaging";
import {
  buildWhatsappAccountDeleteParams,
  buildWhatsappInstancePayload,
  formatWhatsappAccountSubtitle,
  getPlatformLabelKey,
  getWhatsappAccountKey,
  getWhatsappAccountKeyFromSnapshot,
  hasWhatsappAccountDeleteIdentity,
  isOpenwaProvider,
  isUltramessageProvider,
  isWhatsappCloudApiProvider,
  normalizeLinkedAutomatedWhatsappList,
  normalizeWhatsappPhone,
} from "@/lib/whatsapp-messaging-provider";
import {
  deleteClientWhatsappInstance,
  upsertClientWhatsappInstance,
} from "@/utils/api";

const SAVED_TOKEN_MASK = "••••••••••••••••";

const ALL_PLATFORMS = [
  WHATSAPP_MESSAGING_PROVIDERS.OPENWA,
  WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE,
  WHATSAPP_MESSAGING_PROVIDERS.WHATSAPP_CLOUD_API,
];

const EMPTY_WHATSAPP_FORM = {
  platform: DEFAULT_WHATSAPP_MESSAGING_PROVIDER,
  whatsapp_agent: DEFAULT_WHATSAPP_AGENT,
  openwa_session_id: "",
  whatsapp_instance_id: "",
  whatsapp_number: "",
  whatsapp_instance_token: "",
  max_messages_per_day: "",
  max_messages_per_month: "",
};

const agentSelectCls =
  "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white";

function snapshotForm(form) {
  return {
    platform: form.platform,
    whatsapp_agent: form.whatsapp_agent,
    openwa_session_id: form.openwa_session_id?.trim() ?? "",
    whatsapp_instance_id: form.whatsapp_instance_id?.trim() ?? "",
    whatsapp_number: form.whatsapp_number?.trim() ?? "",
    whatsapp_instance_token: form.whatsapp_instance_token?.trim() ?? "",
    max_messages_per_day: form.max_messages_per_day ?? "",
    max_messages_per_month: form.max_messages_per_month ?? "",
  };
}

function formFromAccount(account, { clearToken = true } = {}) {
  if (!account) return { ...EMPTY_WHATSAPP_FORM };

  return {
    platform: account.platform,
    whatsapp_agent: resolveWhatsappAgent(account.whatsapp_agent),
    openwa_session_id: account.openwa_session_id ?? "",
    whatsapp_instance_id: account.whatsapp_instance_id ?? "",
    whatsapp_number: normalizeWhatsappPhone(account.whatsapp_number),
    whatsapp_instance_token: clearToken ? "" : account.whatsapp_instance_token ?? "",
    max_messages_per_day:
      account.max_messages_per_day != null
        ? String(account.max_messages_per_day)
        : "",
    max_messages_per_month:
      account.max_messages_per_month != null
        ? String(account.max_messages_per_month)
        : "",
  };
}

function accountsSyncKey(linked) {
  return JSON.stringify(
    normalizeLinkedAutomatedWhatsappList(linked).map((a) => [
      getWhatsappAccountKey(a),
      a.whatsapp_agent,
      a.max_messages_per_day,
      a.max_messages_per_month,
    ])
  );
}

function extractAccountsFromResponse(result) {
  const data = result?.data ?? result;
  if (Array.isArray(data?.linked_automated_whatsapp)) {
    return data.linked_automated_whatsapp;
  }
  if (Array.isArray(data)) return data;
  if (data?.linked_automated_whatsapp) {
    return normalizeLinkedAutomatedWhatsappList(data.linked_automated_whatsapp);
  }
  return null;
}

const PLATFORM_DEFAULT_LABELS = {
  [WHATSAPP_MESSAGING_PROVIDERS.OPENWA]: "OpenWA",
  [WHATSAPP_MESSAGING_PROVIDERS.WHATSAPP_CLOUD_API]: "WhatsApp Cloud API",
  [WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE]: "UltraMessage",
};

function LinkedAccountCard({
  account,
  accountKey,
  agentLabel,
  onEdit,
  onUnlink,
  pendingUnlink,
  translate,
}) {
  const platformLabelKey = getPlatformLabelKey(account.platform);
  const subtitle = formatWhatsappAccountSubtitle(account);
  const showSubtitle =
    subtitle &&
    subtitle !== account.whatsapp_number &&
    !subtitle.startsWith("+");

  const todayUsed = account.current_messages_sent_today ?? 0;
  const todayMax = account.max_messages_per_day ?? 60;
  const monthUsed = account.current_messages_sent_this_month ?? 0;
  const monthMax = account.max_messages_per_month ?? 1500;

  return (
    <div
      className={`border rounded-lg p-3 space-y-2 ${
        pendingUnlink
          ? "border-amber-200 bg-amber-50/50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {translate(
                platformLabelKey,
                PLATFORM_DEFAULT_LABELS[account.platform]
              )}
            </span>
            {pendingUnlink ? (
              <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {translate(
                  "editClient.whatsapp.pendingUnlinkBadge",
                  "Will unlink on save"
                )}
              </span>
            ) : (
              <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                {translate("editClient.whatsapp.linkedBadge", "Linked")}
              </span>
            )}
          </div>
          {account.whatsapp_number ? (
            <p className="text-sm text-gray-700 mt-0.5" dir="ltr">
              {account.whatsapp_number}
            </p>
          ) : null}
          {showSubtitle ? (
            <p className="text-xs text-gray-500 font-mono truncate" dir="ltr">
              {subtitle}
            </p>
          ) : null}
          <p className="text-xs text-gray-500">{agentLabel}</p>
        </div>
        {!pendingUnlink && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onEdit(accountKey)}
              className="px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/5"
            >
              {translate("editClient.whatsapp.editAccount", "Edit")}
            </button>
            <button
              type="button"
              onClick={() => onUnlink(accountKey)}
              className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50"
            >
              {translate("editClient.whatsapp.unlinkButton", "Unlink")}
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>
          {translate("editClient.whatsapp.usageToday", "Today")}: {todayUsed}/
          {todayMax}
        </span>
        <span>
          {translate("editClient.whatsapp.usageMonth", "This month")}: {monthUsed}/
          {monthMax}
        </span>
      </div>
    </div>
  );
}

const WhatsappAutomationSection = forwardRef(function WhatsappAutomationSection(
  { initialLinkedWhatsapp = null, targetClientId = null, enabled = true },
  ref
) {
  const { translate } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [pendingUnlinks, setPendingUnlinks] = useState(() => new Set());
  const [formMode, setFormMode] = useState(null);
  const [editingAccountKey, setEditingAccountKey] = useState(null);
  const [form, setForm] = useState(EMPTY_WHATSAPP_FORM);
  const [isFormLinked, setIsFormLinked] = useState(false);
  const [hasSavedToken, setHasSavedToken] = useState(false);
  const [tokenDirty, setTokenDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [unlinkTarget, setUnlinkTarget] = useState(null);
  const baselineRef = useRef(null);
  const initialSyncKeyRef = useRef(null);

  const isOpenwa = isOpenwaProvider(form.platform);
  const isUltramessage = isUltramessageProvider(form.platform);
  const isCloudApi = isWhatsappCloudApiProvider(form.platform);

  const safeAccounts = useMemo(
    () => (Array.isArray(accounts) ? accounts : []),
    [accounts]
  );

  const visibleAccounts = useMemo(
    () =>
      safeAccounts.filter(
        (a) => !pendingUnlinks.has(getWhatsappAccountKey(a))
      ),
    [safeAccounts, pendingUnlinks]
  );

  const groupedAccounts = useMemo(() => {
    const groups = new Map();
    for (const account of safeAccounts) {
      const key = getWhatsappAccountKey(account);
      if (!groups.has(account.platform)) {
        groups.set(account.platform, []);
      }
      groups.get(account.platform).push({ account, accountKey: key });
    }
    return ALL_PLATFORMS.filter((platform) => groups.has(platform)).map(
      (platform) => ({
        platform,
        items: groups.get(platform),
      })
    );
  }, [safeAccounts]);

  const initialSyncKey = enabled ? accountsSyncKey(initialLinkedWhatsapp) : null;

  const resetFormState = useCallback(() => {
    setFormMode(null);
    setEditingAccountKey(null);
    setForm(EMPTY_WHATSAPP_FORM);
    setIsFormLinked(false);
    setHasSavedToken(false);
    setTokenDirty(false);
    baselineRef.current = null;
    setFieldErrors({});
  }, []);

  const syncAccountsFromServer = useCallback(
    (linked) => {
      const normalized = normalizeLinkedAutomatedWhatsappList(linked);
      setAccounts(normalized);
      setPendingUnlinks(new Set());
      resetFormState();
      initialSyncKeyRef.current = accountsSyncKey(linked);
    },
    [resetFormState]
  );

  useEffect(() => {
    if (!enabled) {
      initialSyncKeyRef.current = null;
      setAccounts([]);
      setPendingUnlinks(new Set());
      resetFormState();
      return;
    }
    if (initialSyncKey == null || initialSyncKeyRef.current === initialSyncKey) {
      return;
    }
    syncAccountsFromServer(initialLinkedWhatsapp);
  }, [enabled, initialSyncKey, initialLinkedWhatsapp, syncAccountsFromServer, resetFormState]);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const startAddAccount = (preferredPlatform = DEFAULT_WHATSAPP_MESSAGING_PROVIDER) => {
    const nextForm = { ...EMPTY_WHATSAPP_FORM, platform: preferredPlatform };
    setFormMode("add");
    setEditingAccountKey(null);
    setForm(nextForm);
    setIsFormLinked(false);
    setHasSavedToken(false);
    setTokenDirty(false);
    baselineRef.current = snapshotForm(nextForm);
    setFieldErrors({});
  };

  const startEditAccount = (accountKey) => {
    const account = safeAccounts.find(
      (a) => getWhatsappAccountKey(a) === accountKey
    );
    if (!account) return;
    const nextForm = formFromAccount(account);
    setFormMode("edit");
    setEditingAccountKey(accountKey);
    setForm(nextForm);
    setIsFormLinked(true);
    setHasSavedToken(
      account.platform === WHATSAPP_MESSAGING_PROVIDERS.ULTRAMESSAGE
    );
    setTokenDirty(false);
    baselineRef.current = snapshotForm(nextForm);
    setFieldErrors({});
  };

  const cancelForm = () => {
    resetFormState();
  };

  const hasFormChanges = useCallback(() => {
    if (!formMode) return false;
    const snap = snapshotForm(form);
    const baseline = baselineRef.current;
    if (!baseline) {
      return Boolean(
        snap.openwa_session_id ||
          snap.whatsapp_number ||
          snap.whatsapp_instance_id ||
          snap.whatsapp_instance_token ||
          snap.max_messages_per_day ||
          snap.max_messages_per_month
      );
    }
    return JSON.stringify(snap) !== JSON.stringify(baseline) || tokenDirty;
  }, [form, formMode, tokenDirty]);

  const hasChanges = useCallback(() => {
    return pendingUnlinks.size > 0 || hasFormChanges();
  }, [pendingUnlinks, hasFormChanges]);

  const validate = useCallback(() => {
    if (!hasFormChanges() && pendingUnlinks.size === 0) {
      setFieldErrors({});
      return true;
    }

    if (!formMode || !hasFormChanges()) {
      setFieldErrors({});
      return true;
    }

    const errors = {};

    if (isOpenwaProvider(form.platform)) {
      if (!form.openwa_session_id.trim()) {
        errors.openwa_session_id = translate(
          "editClient.whatsapp.openwaSessionIdRequired",
          "OpenWA Session ID is required"
        );
      }
      const businessPhone =
        phoneToE164(form.whatsapp_number, "EG") || form.whatsapp_number.trim();
      if (!businessPhone) {
        errors.whatsapp_number = translate(
          "editClient.whatsapp.numberRequired",
          "WhatsApp number is required"
        );
      } else if (!phoneToE164(form.whatsapp_number, "EG")) {
        errors.whatsapp_number = translate(
          "phoneField.invalid",
          "Invalid phone number"
        );
      }
    } else if (isWhatsappCloudApiProvider(form.platform)) {
      const phoneE164 =
        phoneToE164(form.whatsapp_number, "EG") || form.whatsapp_number.trim();
      if (!phoneE164) {
        errors.whatsapp_number = translate(
          "editClient.whatsapp.numberRequired",
          "WhatsApp number is required"
        );
      } else if (!phoneToE164(form.whatsapp_number, "EG")) {
        errors.whatsapp_number = translate(
          "phoneField.invalid",
          "Invalid phone number"
        );
      }
    } else {
      if (!form.whatsapp_instance_id.trim()) {
        errors.whatsapp_instance_id = translate(
          "editClient.whatsapp.instanceIdRequired",
          "UltraMsg Instance ID is required"
        );
      }
      const phoneE164 =
        phoneToE164(form.whatsapp_number, "EG") || form.whatsapp_number.trim();
      if (!phoneE164) {
        errors.whatsapp_number = translate(
          "editClient.whatsapp.numberRequired",
          "WhatsApp number is required"
        );
      } else if (!phoneToE164(form.whatsapp_number, "EG")) {
        errors.whatsapp_number = translate(
          "phoneField.invalid",
          "Invalid phone number"
        );
      }
      const tokenRequired = !isFormLinked || tokenDirty;
      if (tokenRequired && !form.whatsapp_instance_token.trim()) {
        errors.whatsapp_instance_token = translate(
          "editClient.whatsapp.tokenRequired",
          "UltraMsg token is required"
        );
      }
    }

    if (form.max_messages_per_day !== "") {
      const n = parseInt(String(form.max_messages_per_day), 10);
      if (!Number.isFinite(n) || n < 1 || n > 500) {
        errors.max_messages_per_day = translate(
          "editClient.whatsapp.maxPerDayInvalid",
          "Daily limit must be between 1 and 500"
        );
      }
    }
    if (form.max_messages_per_month !== "") {
      const n = parseInt(String(form.max_messages_per_month), 10);
      if (!Number.isFinite(n) || n < 1 || n > 5000) {
        errors.max_messages_per_month = translate(
          "editClient.whatsapp.maxPerMonthInvalid",
          "Monthly limit must be between 1 and 5000"
        );
      }
    }

    const nextKey = getWhatsappAccountKeyFromSnapshot(snapshotForm(form));
    const isDuplicate = safeAccounts.some((account) => {
      const existingKey = getWhatsappAccountKey(account);
      if (existingKey === editingAccountKey) return false;
      if (pendingUnlinks.has(existingKey)) return false;
      return existingKey === nextKey;
    });
    if (isDuplicate) {
      errors.duplicate_account = translate(
        "editClient.whatsapp.duplicateAccount",
        "An account with these credentials is already linked."
      );
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [
    editingAccountKey,
    form,
    formMode,
    hasFormChanges,
    isFormLinked,
    pendingUnlinks,
    safeAccounts,
    tokenDirty,
    translate,
  ]);

  const applyChanges = useCallback(
    async (clientId) => {
      const targetId = clientId || targetClientId;
      if (!targetId) {
        throw new Error("targetClientId is required");
      }

      let lastResult = null;

      for (const accountKey of pendingUnlinks) {
        const account = safeAccounts.find(
          (a) => getWhatsappAccountKey(a) === accountKey
        );
        if (!account) continue;
        const deleteParams = buildWhatsappAccountDeleteParams(account);
        // Never call DELETE with platform alone when identity is missing —
        // the API would be ambiguous for multi-account same-platform clients.
        if (!hasWhatsappAccountDeleteIdentity(deleteParams)) {
          throw new Error(
            translate(
              "editClient.whatsapp.unlinkMissingIdentity",
              "Cannot unlink this account: missing session id or phone number."
            )
          );
        }
        lastResult = await deleteClientWhatsappInstance({
          ...deleteParams,
          targetClientId: targetId,
        });
      }

      if (hasFormChanges()) {
        const payload = buildWhatsappInstancePayload(snapshotForm(form), {
          isLinked: isFormLinked,
          tokenDirty,
        });
        if (payload) {
          lastResult = await upsertClientWhatsappInstance(payload, {
            targetClientId: targetId,
          });
        }
      }

      const updatedRaw = extractAccountsFromResponse(lastResult);
      if (updatedRaw) {
        syncAccountsFromServer(updatedRaw);
        return { linked_automated_whatsapp: updatedRaw };
      }

      const nextAccounts = safeAccounts.filter(
        (a) => !pendingUnlinks.has(getWhatsappAccountKey(a))
      );
      if (hasFormChanges() && formMode) {
        const payload = buildWhatsappInstancePayload(snapshotForm(form), {
          isLinked: isFormLinked,
          tokenDirty,
        });
        if (payload) {
          const currentKey = editingAccountKey;
          const merged = normalizeLinkedAutomatedWhatsappList([
            ...nextAccounts.filter(
              (a) => getWhatsappAccountKey(a) !== currentKey
            ),
            { ...payload, platform: form.platform },
          ]);
          syncAccountsFromServer(merged);
          return { linked_automated_whatsapp: merged };
        }
      }

      syncAccountsFromServer(nextAccounts);
      return { linked_automated_whatsapp: nextAccounts };
    },
    [
      safeAccounts,
      form,
      formMode,
      hasFormChanges,
      isFormLinked,
      editingAccountKey,
      pendingUnlinks,
      syncAccountsFromServer,
      targetClientId,
      tokenDirty,
      translate,
    ]
  );

  const syncFromServer = useCallback(
    (linked) => {
      syncAccountsFromServer(linked);
    },
    [syncAccountsFromServer]
  );

  const handleUnlinkConfirm = () => {
    if (!unlinkTarget) return;
    setPendingUnlinks((prev) => new Set([...prev, unlinkTarget]));
    if (formMode && editingAccountKey === unlinkTarget) {
      resetFormState();
    }
    setUnlinkTarget(null);
  };

  useImperativeHandle(
    ref,
    () => ({
      validate,
      applyChanges,
      syncFromServer,
      hasChanges,
    }),
    [validate, applyChanges, syncFromServer, hasChanges]
  );

  const showSavedTokenMask =
    isFormLinked &&
    hasSavedToken &&
    !tokenDirty &&
    !form.whatsapp_instance_token.trim();

  const tokenInputValue = showSavedTokenMask
    ? SAVED_TOKEN_MASK
    : form.whatsapp_instance_token;

  const tokenPlaceholder = isFormLinked
    ? translate(
        "editClient.whatsapp.tokenSavedPlaceholder",
        "Token saved — enter a new one to replace"
      )
    : translate("editClient.whatsapp.tokenPlaceholder", "••••••••••••••••");

  const providerOptionClass = (active, disabled) =>
    `flex items-start gap-2 p-3 border rounded-lg transition ${
      disabled
        ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
        : active
          ? "border-primary bg-primary/5 cursor-pointer"
          : "border-gray-300 hover:bg-gray-50 cursor-pointer"
    }`;

  const getAgentLabel = (agentValue) => {
    const option = WHATSAPP_AGENT_OPTIONS.find((o) => o.value === agentValue);
    return option
      ? translate(option.labelKey, option.defaultLabel)
      : resolveWhatsappAgent(agentValue);
  };

  const linkedCount = visibleAccounts.length;
  const pendingUnlinkCount = pendingUnlinks.size;

  return (
    <>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-start"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              {translate("editClient.whatsapp.sectionTitle", "WhatsApp Automation")}
            </span>
            {linkedCount > 0 && (
              <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full shrink-0">
                {translate(
                  "editClient.whatsapp.linkedCountBadge",
                  "{count} linked"
                ).replace("{count}", String(linkedCount))}
              </span>
            )}
            {pendingUnlinkCount > 0 && (
              <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                {translate(
                  "editClient.whatsapp.pendingUnlinkBadge",
                  "Will unlink on save"
                )}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-500 shrink-0 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {expanded && (
          <div className="p-4 border-t border-gray-100 space-y-4">
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-gray-600">
                {translate("editClient.whatsapp.accountsTitle", "Linked accounts")}
              </h4>
              {safeAccounts.length === 0 &&
                pendingUnlinks.size === 0 &&
                !formMode && (
                <p className="text-sm text-gray-500">
                  {translate(
                    "editClient.whatsapp.noAccountsLinked",
                    "No WhatsApp accounts linked yet."
                  )}
                </p>
              )}
              {groupedAccounts.map(({ platform, items }) => {
                const platformLabelKey = getPlatformLabelKey(platform);
                const visibleCount = items.filter(
                  ({ accountKey }) => !pendingUnlinks.has(accountKey)
                ).length;
                return (
                  <div key={platform} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-700">
                        {translate(
                          "editClient.whatsapp.platformGroupTitle",
                          "{platform} ({count})"
                        )
                          .replace(
                            "{platform}",
                            translate(
                              platformLabelKey,
                              PLATFORM_DEFAULT_LABELS[platform]
                            )
                          )
                          .replace("{count}", String(visibleCount))}
                      </p>
                      {!formMode && (
                        <button
                          type="button"
                          onClick={() => startAddAccount(platform)}
                          className="text-xs font-medium text-primary hover:underline shrink-0"
                        >
                          {translate(
                            "editClient.whatsapp.addPlatformAccount",
                            "Add {platform}"
                          ).replace(
                            "{platform}",
                            translate(
                              platformLabelKey,
                              PLATFORM_DEFAULT_LABELS[platform]
                            )
                          )}
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {items.map(({ account, accountKey }) => (
                        <LinkedAccountCard
                          key={accountKey}
                          account={account}
                          accountKey={accountKey}
                          agentLabel={getAgentLabel(account.whatsapp_agent)}
                          onEdit={startEditAccount}
                          onUnlink={setUnlinkTarget}
                          pendingUnlink={pendingUnlinks.has(accountKey)}
                          translate={translate}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {!formMode && (
              <button
                type="button"
                onClick={() => startAddAccount()}
                className="px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/5"
              >
                {translate(
                  "editClient.whatsapp.linkAnotherAccount",
                  "Link another account"
                )}
              </button>
            )}

            {formMode && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50/50">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {formMode === "add"
                      ? translate(
                          "editClient.whatsapp.linkAnotherAccount",
                          "Link another account"
                        )
                      : translate("editClient.whatsapp.editAccount", "Edit account")}
                  </h4>
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {translate("buttons.cancel", "Cancel")}
                  </button>
                </div>

                {formMode === "add" ? (
                  <p className="text-xs text-gray-500">
                    {translate(
                      "editClient.whatsapp.multipleSameTypeHint",
                      "You can link multiple accounts of the same provider."
                    )}
                  </p>
                ) : null}

                {fieldErrors.duplicate_account ? (
                  <p className="text-xs text-red-600">
                    {fieldErrors.duplicate_account}
                  </p>
                ) : null}

                <fieldset className="space-y-2" disabled={formMode === "edit"}>
                  <legend className="text-xs font-medium text-gray-600 mb-1">
                    {translate(
                      "editClient.whatsapp.providerLabel",
                      "Messaging provider"
                    )}
                  </legend>
                  {ALL_PLATFORMS.map((platform) => {
                    const active = form.platform === platform;
                    const disabled = formMode === "edit";
                    const isPlatformOpenwa = isOpenwaProvider(platform);
                    const isPlatformUltramessage = isUltramessageProvider(platform);
                    const isPlatformCloudApi = isWhatsappCloudApiProvider(platform);

                    return (
                      <label
                        key={platform}
                        className={providerOptionClass(active, disabled)}
                      >
                        <input
                          type="radio"
                          name="whatsapp_messaging_provider"
                          className="mt-1"
                          checked={active}
                          disabled={disabled}
                          onChange={() => {
                            if (disabled) return;
                            setForm((prev) => ({ ...prev, platform }));
                            setFieldErrors({});
                          }}
                        />
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {isPlatformOpenwa &&
                              translate("editClient.whatsapp.providerOpenwa", "OpenWA")}
                            {isPlatformUltramessage &&
                              translate(
                                "editClient.whatsapp.providerUltramessage",
                                "UltraMessage"
                              )}
                            {isPlatformCloudApi &&
                              translate(
                                "editClient.whatsapp.providerCloudApi",
                                "WhatsApp Cloud API"
                              )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {isPlatformOpenwa &&
                              translate(
                                "editClient.whatsapp.providerOpenwaHint",
                                "Default — session ID and business phone"
                              )}
                            {isPlatformUltramessage &&
                              translate(
                                "editClient.whatsapp.providerUltramessageHint",
                                "Instance ID, number, and API token"
                              )}
                            {isPlatformCloudApi &&
                              translate(
                                "editClient.whatsapp.providerCloudApiHint",
                                "Only phone number required"
                              )}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </fieldset>

                <div className="flex flex-col gap-1 max-w-md">
                  <label
                    htmlFor="whatsapp_agent"
                    className="text-xs font-medium text-gray-600"
                  >
                    {translate(
                      "editClient.whatsapp.agentLabel",
                      "Inbound WhatsApp agent"
                    )}
                  </label>
                  <select
                    id="whatsapp_agent"
                    name="whatsapp_agent"
                    className={agentSelectCls}
                    value={form.whatsapp_agent}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        whatsapp_agent: e.target.value,
                      }));
                    }}
                  >
                    {WHATSAPP_AGENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {translate(option.labelKey, option.defaultLabel)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <LenaTextField
                    label={translate(
                      "editClient.whatsapp.maxPerDay",
                      "Max messages per day"
                    )}
                    name="max_messages_per_day"
                    type="number"
                    min={1}
                    max={500}
                    value={form.max_messages_per_day}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        max_messages_per_day: e.target.value,
                      }));
                      clearFieldError("max_messages_per_day");
                    }}
                    placeholder="60"
                    error={!!fieldErrors.max_messages_per_day}
                    errorMessage={fieldErrors.max_messages_per_day}
                  />
                  <LenaTextField
                    label={translate(
                      "editClient.whatsapp.maxPerMonth",
                      "Max messages per month"
                    )}
                    name="max_messages_per_month"
                    type="number"
                    min={1}
                    max={5000}
                    value={form.max_messages_per_month}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        max_messages_per_month: e.target.value,
                      }));
                      clearFieldError("max_messages_per_month");
                    }}
                    placeholder="1500"
                    error={!!fieldErrors.max_messages_per_month}
                    errorMessage={fieldErrors.max_messages_per_month}
                  />
                </div>

                {isOpenwa ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <LenaTextField
                      label={translate(
                        "editClient.whatsapp.openwaSessionIdLabel",
                        "OpenWA Session ID"
                      )}
                      name="openwa_session_id"
                      value={form.openwa_session_id}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          openwa_session_id: e.target.value,
                        }));
                        clearFieldError("openwa_session_id");
                      }}
                      placeholder={translate(
                        "editClient.whatsapp.openwaSessionIdPlaceholder",
                        "your-openwa-session"
                      )}
                      required
                      error={!!fieldErrors.openwa_session_id}
                      errorMessage={fieldErrors.openwa_session_id}
                      autoComplete="off"
                    />
                    <PhoneField
                      className="w-full"
                      name="whatsapp_number"
                      label={translate(
                        "editClient.whatsapp.numberLabel",
                        "WhatsApp Number"
                      )}
                      value={form.whatsapp_number ?? ""}
                      onChange={(next) => {
                        setForm((prev) => ({
                          ...prev,
                          whatsapp_number: next ?? "",
                        }));
                        clearFieldError("whatsapp_number");
                      }}
                      defaultCountry="EG"
                      required
                      error={fieldErrors.whatsapp_number}
                    />
                  </div>
                ) : isCloudApi ? (
                  <div className="max-w-md">
                    <PhoneField
                      className="w-full"
                      name="whatsapp_number"
                      label={translate(
                        "editClient.whatsapp.numberLabel",
                        "WhatsApp Number"
                      )}
                      value={form.whatsapp_number ?? ""}
                      onChange={(next) => {
                        setForm((prev) => ({
                          ...prev,
                          whatsapp_number: next ?? "",
                        }));
                        clearFieldError("whatsapp_number");
                      }}
                      defaultCountry="EG"
                      required
                      error={fieldErrors.whatsapp_number}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <LenaTextField
                        label={translate(
                          "editClient.whatsapp.instanceIdLabel",
                          "UltraMsg Instance ID"
                        )}
                        name="whatsapp_instance_id"
                        value={form.whatsapp_instance_id}
                        onChange={(e) => {
                          setForm((prev) => ({
                            ...prev,
                            whatsapp_instance_id: e.target.value,
                          }));
                          clearFieldError("whatsapp_instance_id");
                        }}
                        placeholder={translate(
                          "editClient.whatsapp.instanceIdPlaceholder",
                          "instance177433"
                        )}
                        required
                        error={!!fieldErrors.whatsapp_instance_id}
                        errorMessage={fieldErrors.whatsapp_instance_id}
                        autoComplete="off"
                      />
                      <PhoneField
                        className="w-full"
                        name="whatsapp_number"
                        label={translate(
                          "editClient.whatsapp.numberLabel",
                          "WhatsApp Number"
                        )}
                        value={form.whatsapp_number ?? ""}
                        onChange={(next) => {
                          setForm((prev) => ({
                            ...prev,
                            whatsapp_number: next ?? "",
                          }));
                          clearFieldError("whatsapp_number");
                        }}
                        defaultCountry="EG"
                        required
                        error={fieldErrors.whatsapp_number}
                      />
                    </div>

                    <LenaTextField
                      label={translate(
                        "editClient.whatsapp.tokenLabel",
                        "UltraMsg Token"
                      )}
                      name="whatsapp_instance_token"
                      type="password"
                      value={tokenInputValue}
                      onChange={(e) => {
                        const next = e.target.value;
                        setTokenDirty(true);
                        setForm((prev) => ({
                          ...prev,
                          whatsapp_instance_token:
                            next === SAVED_TOKEN_MASK ? "" : next,
                        }));
                        clearFieldError("whatsapp_instance_token");
                      }}
                      onFocus={() => {
                        if (showSavedTokenMask) {
                          setTokenDirty(true);
                          setForm((prev) => ({
                            ...prev,
                            whatsapp_instance_token: "",
                          }));
                        }
                      }}
                      placeholder={tokenPlaceholder}
                      required={!isFormLinked || tokenDirty}
                      error={!!fieldErrors.whatsapp_instance_token}
                      errorMessage={fieldErrors.whatsapp_instance_token}
                      autoComplete="new-password"
                      helperText={
                        showSavedTokenMask || (isFormLinked && hasSavedToken)
                          ? translate(
                              "editClient.whatsapp.tokenHelperLinked",
                              "A token is already saved. Enter a new token to replace it."
                            )
                          : undefined
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={Boolean(unlinkTarget)}
        onClose={() => setUnlinkTarget(null)}
        onConfirm={handleUnlinkConfirm}
        title={translate(
          "editClient.whatsapp.unlinkPlatformConfirmTitle",
          "Remove this WhatsApp account?"
        )}
        message={translate(
          "editClient.whatsapp.unlinkPlatformConfirmMessage",
          "This will unlink this WhatsApp account. Other linked accounts will remain."
        )}
        confirmLabel={translate("editClient.whatsapp.unlinkConfirmButton", "Remove")}
        cancelLabel={translate("buttons.cancel", "Cancel")}
      />
    </>
  );
});

WhatsappAutomationSection.displayName = "WhatsappAutomationSection";

export default WhatsappAutomationSection;
