"use client";

import { CLIENT_AGENT_OPTIONS } from "@/constants/client-agents";
import { useI18n } from "@/hooks/useI18n";
import { updateEnabledAgents } from "@/utils/api";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

function normalizeAgentIds(ids) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter(Boolean))].sort();
}

function agentIdsEqual(a, b) {
  const left = normalizeAgentIds(a);
  const right = normalizeAgentIds(b);
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
}

export default function AutomationAgentsSection({ enabledAgents = [], isProfileLoading }) {
  const { translate } = useI18n();
  const queryClient = useQueryClient();
  const [selectedAgentIds, setSelectedAgentIds] = useState(() =>
    normalizeAgentIds(enabledAgents)
  );
  const [savedAgentIds, setSavedAgentIds] = useState(() =>
    normalizeAgentIds(enabledAgents)
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const next = normalizeAgentIds(enabledAgents);
    setSelectedAgentIds(next);
    setSavedAgentIds(next);
  }, [enabledAgents]);

  const isChanged = useMemo(
    () => !agentIdsEqual(selectedAgentIds, savedAgentIds),
    [selectedAgentIds, savedAgentIds]
  );

  const handleToggle = (agentId) => {
    setSelectedAgentIds((prev) => {
      if (prev.includes(agentId)) {
        return prev.filter((id) => id !== agentId);
      }
      return [...prev, agentId];
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const result = await updateEnabledAgents(selectedAgentIds);
      const updated = normalizeAgentIds(result?.data?.enabled_agents ?? selectedAgentIds);
      setSelectedAgentIds(updated);
      setSavedAgentIds(updated);
      await queryClient.invalidateQueries({ queryKey: ["clientData"] });
      toast.success(translate("clientInfo.automationAgents.saveSuccess"));
    } catch (error) {
      toast.error(
        error?.message ||
          translate(
            "clientInfo.automationAgents.saveFailed",
            "Failed to update automation agents"
          )
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {translate("clientInfo.automationAgents.title", "Automation Agents")}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {translate(
              "clientInfo.automationAgents.description",
              "Choose which automated agents run for your account."
            )}
          </p>
        </div>

        {isChanged && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isProfileLoading}
            className="shrink-0 inline-flex items-center justify-center gap-2 py-2 px-4 bg-primary text-white rounded-md font-medium transition-colors hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{translate("clientInfo.automationAgents.saving", "Saving...")}</span>
              </>
            ) : (
              translate("clientInfo.automationAgents.save", "Save")
            )}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {CLIENT_AGENT_OPTIONS.map((agent) => {
          const isChecked = selectedAgentIds.includes(agent.id);

          return (
            <label
              key={agent.id}
              className="flex items-start gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggle(agent.id)}
                disabled={isProfileLoading || isSaving}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <div className="min-w-0">
                <div className="font-semibold text-gray-900">
                  {translate(agent.labelKey, agent.defaultLabel)}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {translate(agent.descriptionKey, agent.defaultDescription)}
                </p>
                {agent.helperTextKey ? (
                  <p className="text-xs text-gray-500 mt-2">
                    {translate(agent.helperTextKey, agent.defaultHelperText)}
                  </p>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
