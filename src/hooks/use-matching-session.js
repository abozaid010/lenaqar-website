"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  runLeadMatching,
} from "@/lib/matching/run-lead-matching";
import {
  MATCHING_STATUS,
  isSendEligibleStatus,
} from "@/lib/matching/matching-statuses";
import { getMatchingUnitId } from "@/lib/matching/unit-recommendation-service";
import { buildRecommendationMessageAr } from "@/lib/matching/build-recommendation-message-ar";
import { leadToWhatsappRecipient } from "@/lib/whatsapp-recipient";
import {
  sendWhatsappWithClientConfig,
  toTransportPlatform,
  resolveSenderPhoneNumber,
  WHATSAPP_MESSAGE_SOURCES,
} from "@/lib/whatsapp-messaging-provider";

/**
 * Session-only Matching state: results, dismissals, progress, send.
 */
export function useMatchingSession() {
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [resultsByLeadId, setResultsByLeadId] = useState(() => new Map());
  const cancelRef = useRef({ cancelled: false });

  const results = useMemo(
    () => Array.from(resultsByLeadId.values()),
    [resultsByLeadId],
  );

  const eligibleForSend = useMemo(() => {
    return results.filter(
      (r) =>
        isSendEligibleStatus(r.status) &&
        Array.isArray(r.recommendedUnitIds) &&
        r.recommendedUnitIds.length > 0,
    );
  }, [results]);

  const resetResults = useCallback(() => {
    cancelRef.current.cancelled = true;
    setResultsByLeadId(new Map());
    setProgress({ done: 0, total: 0 });
    setPhase("idle");
  }, []);

  const runMatching = useCallback(async (leads) => {
    const clientId = LenaCookiesManager.getClientId();
    cancelRef.current = { cancelled: false };
    setPhase("matching");
    setProgress({ done: 0, total: leads.length });
    setResultsByLeadId(new Map());

    const next = new Map();
    await runLeadMatching(leads, clientId, {
      signal: cancelRef.current,
      onProgress: (done, total, result) => {
        if (result?.leadId) {
          next.set(result.leadId, result);
          setResultsByLeadId(new Map(next));
        }
        setProgress({ done, total });
      },
    });

    if (!cancelRef.current.cancelled) {
      setPhase("review");
    }
  }, []);

  const dismissRecommendedUnit = useCallback((leadId, unitId) => {
    setResultsByLeadId((prev) => {
      const current = prev.get(leadId);
      if (!current) return prev;
      const nextMap = new Map(prev);
      const recommendedUnitIds = (current.recommendedUnitIds || []).filter(
        (id) => id !== unitId,
      );
      const dismissedUnitIds = Array.from(
        new Set([...(current.dismissedUnitIds || []), unitId]),
      );
      const status =
        recommendedUnitIds.length > 0
          ? MATCHING_STATUS.READY
          : current.allUnits?.length
            ? MATCHING_STATUS.NO_MATCHING_UNITS
            : current.status;
      nextMap.set(leadId, {
        ...current,
        recommendedUnitIds,
        dismissedUnitIds,
        status:
          recommendedUnitIds.length > 0
            ? MATCHING_STATUS.READY
            : status === MATCHING_STATUS.READY ||
                status === MATCHING_STATUS.READY_TO_SEND
              ? MATCHING_STATUS.NO_MATCHING_UNITS
              : current.status,
        messageAr: undefined,
      });
      return nextMap;
    });
  }, []);

  const setLeadMessage = useCallback((leadId, messageAr) => {
    setResultsByLeadId((prev) => {
      const current = prev.get(leadId);
      if (!current) return prev;
      const nextMap = new Map(prev);
      nextMap.set(leadId, { ...current, messageAr });
      return nextMap;
    });
  }, []);

  const getRecommendedUnits = useCallback((result) => {
    if (!result) return [];
    const idSet = new Set(result.recommendedUnitIds || []);
    return (result.allUnits || []).filter((u) =>
      idSet.has(getMatchingUnitId(u)),
    );
  }, []);

  const buildDefaultMessage = useCallback(
    (result) => {
      const clientId = LenaCookiesManager.getClientId();
      const units = getRecommendedUnits(result);
      return buildRecommendationMessageAr({
        leadName: result?.lead?.name,
        units,
        clientId,
      });
    },
    [getRecommendedUnits],
  );

  const sendRecommendations = useCallback(
    async ({ selectedAccount, draftMessages }) => {
      const transportPlatform = toTransportPlatform(selectedAccount.platform);
      const senderPhoneNumber = resolveSenderPhoneNumber(selectedAccount);

      const targets = eligibleForSend.filter((r) => {
        const msg = draftMessages?.[r.leadId] ?? r.messageAr;
        return String(msg || "").trim().length > 0;
      });

      setPhase("sending");
      setProgress({ done: 0, total: targets.length });

      const successfulLeads = [];
      let sent = 0;
      let failed = 0;

      for (let i = 0; i < targets.length; i++) {
        const result = targets[i];
        const recipient = leadToWhatsappRecipient(result.lead);
        const message = String(
          draftMessages?.[result.leadId] ??
            result.messageAr ??
            buildDefaultMessage(result),
        ).trim();

        if (!recipient || !message) {
          failed += 1;
          setResultsByLeadId((prev) => {
            const nextMap = new Map(prev);
            const current = nextMap.get(result.leadId);
            if (current) {
              nextMap.set(result.leadId, {
                ...current,
                status: MATCHING_STATUS.FAILED,
              });
            }
            return nextMap;
          });
          setProgress({ done: i + 1, total: targets.length });
          continue;
        }

        try {
          await sendWhatsappWithClientConfig({
            config: selectedAccount,
            messages: [
              {
                ...recipient,
                message,
                platform: transportPlatform,
                ...(senderPhoneNumber
                  ? { sender_phone_number: senderPhoneNumber }
                  : {}),
                source: WHATSAPP_MESSAGE_SOURCES.HUMAN,
              },
            ],
          });
          sent += 1;
          successfulLeads.push(result.lead);
          setResultsByLeadId((prev) => {
            const nextMap = new Map(prev);
            const current = nextMap.get(result.leadId);
            if (current) {
              nextMap.set(result.leadId, {
                ...current,
                status: MATCHING_STATUS.SENT,
                messageAr: message,
              });
            }
            return nextMap;
          });
        } catch {
          failed += 1;
          setResultsByLeadId((prev) => {
            const nextMap = new Map(prev);
            const current = nextMap.get(result.leadId);
            if (current) {
              nextMap.set(result.leadId, {
                ...current,
                status: MATCHING_STATUS.FAILED,
                messageAr: message,
              });
            }
            return nextMap;
          });
        }

        setProgress({ done: i + 1, total: targets.length });
      }

      setPhase("review");
      return { sent, failed, successfulLeads };
    },
    [eligibleForSend, buildDefaultMessage],
  );

  return {
    phase,
    progress,
    results,
    resultsByLeadId,
    eligibleForSend,
    runMatching,
    resetResults,
    dismissRecommendedUnit,
    setLeadMessage,
    getRecommendedUnits,
    buildDefaultMessage,
    sendRecommendations,
  };
}
