"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  getWhatsappRecipientDedupeKey,
  leadToWhatsappRecipient,
} from "@/lib/whatsapp-recipient";

const DashboardLeadsBulkContext = createContext(null);

export { leadToWhatsappRecipient };

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

  const buildRecipients = useCallback((leads) => {
    const seen = new Set();
    const recipients = [];
    for (const lead of leads) {
      const recipient = leadToWhatsappRecipient(lead);
      const dedupeKey = getWhatsappRecipientDedupeKey(recipient);
      if (!recipient || !dedupeKey || seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      recipients.push(recipient);
    }
    return recipients;
  }, []);

  /** Always all currently loaded/visible leads (panel “all loaded” WhatsApp). */
  const allVisibleRecipients = useMemo(
    () => buildRecipients(visibleLeads),
    [buildRecipients, visibleLeads],
  );

  /** Selected leads only (selection-bar WhatsApp). */
  const selectedRecipients = useMemo(
    () => buildRecipients(selectedLeads),
    [buildRecipients, selectedLeads],
  );

  /** Prefer selected when any; otherwise all visible (legacy callers). */
  const resolvedRecipients = useMemo(
    () =>
      selectedLeads.length > 0 ? selectedRecipients : allVisibleRecipients,
    [selectedLeads.length, selectedRecipients, allVisibleRecipients],
  );

  const value = useMemo(
    () => ({
      visibleLeads,
      selectedLeadIds,
      selectedLeads,
      resolvedRecipients,
      allVisibleRecipients,
      selectedRecipients,
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
      allVisibleRecipients,
      selectedRecipients,
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
