"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { normalizeCampaignPhoneParam } from "@/utils/campaign-chat-session";

const DashboardLeadsBulkContext = createContext(null);

export function leadToWhatsappRecipient(lead) {
  if (!lead?.phone_number) return null;
  const phone_number = normalizeCampaignPhoneParam(lead.phone_number);
  if (!phone_number) return null;
  return {
    phone_number,
    user_name: String(lead.name || "").trim() || phone_number,
  };
}

export function DashboardLeadsBulkProvider({ children }) {
  const [visibleLeads, setVisibleLeads] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState(() => new Set());

  const setVisibleLeadsFromList = useCallback((leads) => {
    setVisibleLeads(Array.isArray(leads) ? leads : []);
  }, []);

  const toggleLeadSelection = useCallback((userId) => {
    if (!userId) return;
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedLeadIds((prev) => {
      const visibleIds = visibleLeads
        .map((l) => l?.user_id)
        .filter(Boolean);
      if (visibleIds.length === 0) return prev;
      const allSelected = visibleIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(visibleIds);
    });
  }, [visibleLeads]);

  const clearLeadSelection = useCallback(() => {
    setSelectedLeadIds(new Set());
  }, []);

  const isLeadSelected = useCallback(
    (userId) => selectedLeadIds.has(userId),
    [selectedLeadIds]
  );

  const selectedLeads = useMemo(() => {
    if (selectedLeadIds.size === 0) return [];
    return visibleLeads.filter((l) => l?.user_id && selectedLeadIds.has(l.user_id));
  }, [visibleLeads, selectedLeadIds]);

  const resolvedRecipients = useMemo(() => {
    const source =
      selectedLeads.length > 0 ? selectedLeads : visibleLeads;
    const seen = new Set();
    const recipients = [];
    for (const lead of source) {
      const recipient = leadToWhatsappRecipient(lead);
      if (!recipient || seen.has(recipient.phone_number)) continue;
      seen.add(recipient.phone_number);
      recipients.push(recipient);
    }
    return recipients;
  }, [selectedLeads, visibleLeads]);

  const value = useMemo(
    () => ({
      visibleLeads,
      selectedLeadIds,
      selectedLeads,
      resolvedRecipients,
      setVisibleLeadsFromList,
      toggleLeadSelection,
      toggleSelectAllVisible,
      clearLeadSelection,
      isLeadSelected,
      hasSelection: selectedLeadIds.size > 0,
    }),
    [
      visibleLeads,
      selectedLeadIds,
      selectedLeads,
      resolvedRecipients,
      setVisibleLeadsFromList,
      toggleLeadSelection,
      toggleSelectAllVisible,
      clearLeadSelection,
      isLeadSelected,
    ]
  );

  return (
    <DashboardLeadsBulkContext.Provider value={value}>
      {children}
    </DashboardLeadsBulkContext.Provider>
  );
}

export function useDashboardLeadsBulk() {
  const ctx = useContext(DashboardLeadsBulkContext);
  if (!ctx) {
    throw new Error(
      "useDashboardLeadsBulk must be used within DashboardLeadsBulkProvider"
    );
  }
  return ctx;
}
