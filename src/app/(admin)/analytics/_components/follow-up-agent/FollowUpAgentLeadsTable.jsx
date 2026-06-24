"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { LEAD_FILTER_CHIPS } from "@/constants/follow-up-agent";
import { getClientid } from "@/utils/api";
import ActionTakenBadge from "./ActionTakenBadge";

const COLUMNS = ["name", "phone", "action", "attempt", "intent", "message", "chat"];
const MESSAGE_MAX_LENGTH = 48;

function truncateMessage(message) {
  if (!message) return "-";
  if (message.length <= MESSAGE_MAX_LENGTH) return message;
  return `${message.slice(0, MESSAGE_MAX_LENGTH)}…`;
}

export default function FollowUpAgentLeadsTable({ leads = [] }) {
  const { translate } = useI18n();
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [direction, setDirection] = useState("asc");

  const clientId = getClientid();
  const dashboardPrefix = clientId ? `/${clientId}` : "";

  const filteredLeads = useMemo(() => {
    const chip = LEAD_FILTER_CHIPS.find((item) => item.id === activeFilter);
    if (!chip || !chip.actions) return leads;
    return leads.filter((lead) => chip.actions.includes(lead.action_taken));
  }, [leads, activeFilter]);

  const sortedLeads = useMemo(() => {
    const list = [...filteredLeads];
    list.sort((a, b) => {
      let aValue;
      let bValue;

      if (sortBy === "action") {
        aValue = a.action_taken || "";
        bValue = b.action_taken || "";
      } else if (sortBy === "attempt") {
        aValue = Number(a.attempt_number ?? 0);
        bValue = Number(b.attempt_number ?? 0);
      } else if (sortBy === "name") {
        aValue = a.name || "";
        bValue = b.name || "";
      } else {
        aValue = a[sortBy] ?? "";
        bValue = b[sortBy] ?? "";
      }

      if (typeof aValue === "string" || typeof bValue === "string") {
        const result = String(aValue).localeCompare(String(bValue));
        return direction === "asc" ? result : -result;
      }

      const result = Number(aValue) - Number(bValue);
      return direction === "asc" ? result : -result;
    });
    return list;
  }, [filteredLeads, sortBy, direction]);

  const onSort = (column) => {
    if (sortBy === column) {
      setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setDirection("asc");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h3 className="text-lg font-semibold mb-4">
        {translate("analytics.followUpAgent.leads_title")}
      </h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {LEAD_FILTER_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setActiveFilter(chip.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeFilter === chip.id
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {translate(`analytics.followUpAgent.filters.${chip.id}`)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column}
                  onClick={() => {
                    if (column !== "chat" && column !== "message") onSort(column);
                  }}
                  className={`p-3 text-start text-xs font-semibold text-gray-600 uppercase ${
                    column !== "chat" && column !== "message" ? "cursor-pointer" : ""
                  }`}
                >
                  {translate(`analytics.followUpAgent.col_${column}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedLeads.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="p-6 text-center text-sm text-gray-500">
                  {translate("analytics.followUpAgent.no_leads_for_filters")}
                </td>
              </tr>
            ) : (
              sortedLeads.map((lead) => (
                <tr key={lead.user_id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="p-3 text-sm">{lead.name || "-"}</td>
                  <td className="p-3 text-sm" dir="ltr">
                    {lead.phone_number || "-"}
                  </td>
                  <td className="p-3 text-sm">
                    <ActionTakenBadge
                      actionTaken={lead.action_taken}
                      followupKind={lead.followup_kind}
                    />
                  </td>
                  <td className="p-3 text-sm">{lead.attempt_number ?? 0}</td>
                  <td className="p-3 text-sm">
                    {lead.intent
                      ? translate(`analytics.followUpAgent.intent.${lead.intent}`)
                      : "-"}
                  </td>
                  <td className="p-3 text-sm max-w-[200px]">
                    <span title={lead.message || undefined} dir="rtl" className="line-clamp-2">
                      {truncateMessage(lead.message)}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    {lead.user_id ? (
                      <Link
                        href={`${dashboardPrefix}/dashboard?userId=${encodeURIComponent(lead.user_id)}`}
                        className="text-primary hover:underline text-xs font-medium whitespace-nowrap"
                      >
                        {translate("analytics.followUpAgent.view_chat")}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
