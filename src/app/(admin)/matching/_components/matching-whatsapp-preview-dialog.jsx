"use client";

import { useEffect, useMemo, useState } from "react";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import LenaTextarea from "@/components/ui/inputs/lena-textarea";
import WhatsappPlatformSelect from "@/components/whatsapp/WhatsappPlatformSelect";
import WhatsappRestrictionNotice from "@/components/whatsapp/WhatsappRestrictionNotice";
import { useI18n } from "@/hooks/useI18n";
import { useMessagingProviderConfig } from "@/hooks/useMessagingProviderConfig";
import { useWhatsappSelectedAccount } from "@/hooks/useWhatsappSelectedAccount";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  getEffectiveMessagingAccount,
  isMessagingConfigReady,
} from "@/lib/whatsapp-messaging-provider";
import { getMatchingUnitId } from "@/lib/matching/unit-recommendation-service";
import { buildRecommendationMessageAr } from "@/lib/matching/build-recommendation-message-ar";
import { X } from "lucide-react";

/**
 * Per-lead editable Arabic WhatsApp preview before sending recommendations.
 */
export default function MatchingWhatsappPreviewDialog({
  isOpen,
  onClose,
  eligibleResults = [],
  getRecommendedUnits,
  onDismissUnit,
  onSend,
  sending = false,
}) {
  const { translate } = useI18n();
  const clientId = LenaCookiesManager.getClientId() || "public";
  const { data: messagingData } = useMessagingProviderConfig(clientId);
  const {
    selectedPlatform,
    setSelectedPlatform,
    isAccountSelectionLocked,
    isWhatsappSendBlocked,
    whatsappRestrictionCode,
  } = useWhatsappSelectedAccount(messagingData, clientId);
  const accounts = messagingData?.accounts ?? [];
  const selectedAccount = getEffectiveMessagingAccount(
    messagingData,
    selectedPlatform,
  );

  const [draftMessages, setDraftMessages] = useState({});
  const [draftUnitIds, setDraftUnitIds] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const messages = {};
    const unitIds = {};
    for (const result of eligibleResults) {
      const units = getRecommendedUnits?.(result) || [];
      unitIds[result.leadId] = (result.recommendedUnitIds || []).slice();
      messages[result.leadId] =
        result.messageAr ||
        buildRecommendationMessageAr({
          leadName: result.lead?.name,
          units,
          clientId,
        });
    }
    setDraftMessages(messages);
    setDraftUnitIds(unitIds);
    setError("");
  }, [isOpen, eligibleResults, getRecommendedUnits, clientId]);

  const canSubmit = useMemo(() => {
    if (!isMessagingConfigReady(selectedAccount)) return false;
    if (isWhatsappSendBlocked) return false;
    if (!eligibleResults.length) return false;
    return eligibleResults.some((r) => {
      const ids = draftUnitIds[r.leadId] || [];
      const msg = String(draftMessages[r.leadId] || "").trim();
      return ids.length > 0 && msg.length > 0;
    });
  }, [
    selectedAccount,
    isWhatsappSendBlocked,
    eligibleResults,
    draftUnitIds,
    draftMessages,
  ]);

  const rebuildMessageForLead = (result, nextUnitIds) => {
    const idSet = new Set(nextUnitIds);
    const units = (result.allUnits || []).filter((u) =>
      idSet.has(getMatchingUnitId(u)),
    );
    return buildRecommendationMessageAr({
      leadName: result.lead?.name,
      units,
      clientId,
    });
  };

  const handleRemoveUnit = (result, unitId) => {
    const nextIds = (draftUnitIds[result.leadId] || []).filter(
      (id) => id !== unitId,
    );
    setDraftUnitIds((prev) => ({ ...prev, [result.leadId]: nextIds }));
    setDraftMessages((prev) => ({
      ...prev,
      [result.leadId]: rebuildMessageForLead(result, nextIds),
    }));
    onDismissUnit?.(result.leadId, unitId);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!canSubmit) return;
    if (!isMessagingConfigReady(selectedAccount)) {
      setError(
        translate(
          "editClient.whatsapp.notConfigured",
          "WhatsApp messaging is not configured for this client.",
        ),
      );
      return;
    }
    try {
      await onSend?.({
        selectedAccount,
        draftMessages,
      });
    } catch (err) {
      setError(
        err?.message ||
          translate("matching.errors.unitsFetch", "Unable to send messages."),
      );
    }
  };

  if (!isOpen) return null;

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={translate("matching.preview.title")}
      submitLabel={translate("matching.preview.submit")}
      onSubmit={handleSubmit}
      submitDisabled={!canSubmit || sending}
      submitLoading={sending}
      dialogClassName="max-w-3xl"
      bodyClassName="max-h-[70vh] overflow-y-auto space-y-4"
      closeOnEscape
    >
      {accounts.length > 1 && (
        <WhatsappPlatformSelect
          accounts={accounts}
          hasMultipleAccounts={accounts.length > 1}
          value={selectedPlatform}
          onChange={setSelectedPlatform}
          locked={isAccountSelectionLocked}
          disabled={isAccountSelectionLocked || sending}
        />
      )}
      <WhatsappRestrictionNotice code={whatsappRestrictionCode} />

      {!eligibleResults.length && (
        <p className="text-sm text-gray-500">
          {translate("matching.preview.noEligible")}
        </p>
      )}

      {eligibleResults.map((result) => {
        const name = result.lead?.name || result.lead?.phone_number || result.leadId;
        const ids = draftUnitIds[result.leadId] || [];
        const units = (result.allUnits || []).filter((u) =>
          ids.includes(getMatchingUnitId(u)),
        );
        return (
          <div
            key={result.leadId}
            className="rounded-lg border border-gray-200 p-3 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">{name}</h3>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600">
                {translate("matching.preview.recommendedUnits")}
              </p>
              <div className="flex flex-wrap gap-2">
                {units.map((unit) => {
                  const id = getMatchingUnitId(unit);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-800"
                    >
                      {unit.code || id}
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-700"
                        aria-label={translate("matching.actions.removeUnit")}
                        onClick={() => handleRemoveUnit(result, id)}
                        disabled={sending}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  );
                })}
                {!units.length && (
                  <span className="text-xs text-gray-500">—</span>
                )}
              </div>
            </div>

            <LenaTextarea
              label={translate("matching.preview.leadMessage")}
              value={draftMessages[result.leadId] || ""}
              onChange={(e) =>
                setDraftMessages((prev) => ({
                  ...prev,
                  [result.leadId]: e.target.value,
                }))
              }
              rows={8}
              disabled={sending}
              dir="rtl"
            />
          </div>
        );
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </UnifiedDialog>
  );
}
