"use client";

import { useEffect, useMemo, useState } from "react";
import {
  canViewAllDashboardLeads,
  getDashboardLoggedInEmail,
} from "@/lib/dashboard-lead-access";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  loadDashboardTeamMembersOnce,
  readCachedDashboardTeamMembers,
} from "@/lib/dashboard-team-emails-session";

/**
 * @param {{ email?: string, name?: string } | null | undefined} option
 * @returns {string}
 */
export function getAuthorOptionLabel(option) {
  const name = typeof option?.name === "string" ? option.name.trim() : "";
  if (name) return name;
  return typeof option?.email === "string" ? option.email.trim() : "";
}

/**
 * @param {string | null | undefined} value
 * @param {Array<{ email: string, name: string }>} options
 * @returns {string}
 */
export function resolveAuthorDisplayLabel(value, options) {
  const email = typeof value === "string" ? value.trim() : "";
  if (!email) return "";
  const match = (options || []).find(
    (option) => option.email.toLowerCase() === email.toLowerCase(),
  );
  if (match) return getAuthorOptionLabel(match);
  return email;
}

/**
 * Team author options for Units / Leads-style Author filters.
 * Uses the same Team API + session cache as the Leads Author filter.
 * admin/owner → full team list; other roles → own email only.
 *
 * @param {{ selectedAuthor?: string }} [options]
 */
export function useTeamAuthorOptions({ selectedAuthor = "" } = {}) {
  const [clientId, setClientId] = useState("");
  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setClientId(LenaCookiesManager.getClientId() || "");
    setLoggedInEmail(getDashboardLoggedInEmail());
    setIsAdminUser(canViewAllDashboardLeads());
  }, []);

  useEffect(() => {
    if (!isAdminUser || !clientId) {
      setTeamMembers([]);
      setIsLoading(false);
      return;
    }

    const cached = readCachedDashboardTeamMembers(clientId);
    if (cached) {
      setTeamMembers(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    let cancelled = false;
    loadDashboardTeamMembersOnce(clientId).then((members) => {
      if (cancelled) return;
      if (Array.isArray(members)) {
        setTeamMembers(members);
      } else if (!cached) {
        setTeamMembers([]);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [clientId, isAdminUser]);

  const authorOptions = useMemo(() => {
    if (!isAdminUser) {
      return loggedInEmail ? [{ email: loggedInEmail, name: "" }] : [];
    }

    /** @type {Map<string, { email: string, name: string }>} */
    const byEmail = new Map();
    for (const member of teamMembers) {
      const email =
        typeof member?.email === "string" ? member.email.trim() : "";
      if (!email) continue;
      byEmail.set(email.toLowerCase(), {
        email,
        name: typeof member?.name === "string" ? member.name.trim() : "",
      });
    }
    if (loggedInEmail) {
      const key = loggedInEmail.toLowerCase();
      if (!byEmail.has(key)) {
        byEmail.set(key, { email: loggedInEmail, name: "" });
      }
    }
    const selected =
      typeof selectedAuthor === "string" ? selectedAuthor.trim() : "";
    if (selected) {
      const key = selected.toLowerCase();
      if (!byEmail.has(key)) {
        byEmail.set(key, { email: selected, name: "" });
      }
    }

    return Array.from(byEmail.values()).sort((a, b) => {
      const labelA = (a.name || a.email).toLowerCase();
      const labelB = (b.name || b.email).toLowerCase();
      return labelA.localeCompare(labelB);
    });
  }, [isAdminUser, loggedInEmail, teamMembers, selectedAuthor]);

  /** All team members for owner-phone filter (names shown; phone used for API query). */
  const teamPhoneOptions = useMemo(() => {
    if (!isAdminUser) return [];

    /** @type {Map<string, { phone: string, name: string, email: string }>} */
    const byEmail = new Map();
    for (const member of teamMembers) {
      const email =
        typeof member?.email === "string" ? member.email.trim() : "";
      if (!email) continue;
      const key = email.toLowerCase();
      const phone =
        typeof member?.phone === "string" ? member.phone.trim() : "";
      const name =
        typeof member?.name === "string" ? member.name.trim() : "";
      const existing = byEmail.get(key);
      if (!existing) {
        byEmail.set(key, { email, name, phone });
        continue;
      }
      byEmail.set(key, {
        email: existing.email,
        name: existing.name || name,
        phone: existing.phone || phone,
      });
    }

    return Array.from(byEmail.values()).sort((a, b) => {
      const labelA = (a.name || a.email).toLowerCase();
      const labelB = (b.name || b.email).toLowerCase();
      return labelA.localeCompare(labelB);
    });
  }, [isAdminUser, teamMembers]);

  return {
    authorOptions,
    teamPhoneOptions,
    isLoading: isAdminUser && isLoading,
    isAdminUser,
    loggedInEmail,
  };
}
