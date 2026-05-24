"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import { useI18n } from "@/hooks/useI18n";
import {
  getClientProfile,
  linkClientWhatsappInstance,
  unlinkClientWhatsappInstance,
} from "@/utils/api";
import { getApiErrorMessage } from "@/utils/localized-api-error";

const EMPTY_WHATSAPP_FORM = {
  whatsapp_instance_id: "",
  whatsapp_number: "",
  whatsapp_instance_token: "",
};

function readLinkedWhatsapp(profileResponse) {
  const data = profileResponse?.data;
  if (!data || typeof data !== "object") return null;
  return data.linked_automated_whatsapp ?? null;
}

export default function WhatsappAutomationSection({ clientId, enabled = true }) {
  const { translate } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const [form, setForm] = useState(EMPTY_WHATSAPP_FORM);
  const [isLinked, setIsLinked] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [unlinkOpen, setUnlinkOpen] = useState(false);

  const {
    data: profileResponse,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["clientProfile", clientId, "whatsapp"],
    queryFn: () => getClientProfile(clientId),
    enabled: Boolean(enabled && clientId),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const applyLinkedState = useCallback((linked) => {
    if (linked) {
      setIsLinked(true);
      setForm({
        whatsapp_instance_id: linked.whatsapp_instance_id ?? "",
        whatsapp_number: linked.whatsapp_number ?? "",
        whatsapp_instance_token: "",
      });
    } else {
      setIsLinked(false);
      setForm(EMPTY_WHATSAPP_FORM);
    }
    setFieldErrors({});
  }, []);

  useEffect(() => {
    if (!enabled) return;
    applyLinkedState(readLinkedWhatsapp(profileResponse));
  }, [profileResponse, enabled, applyLinkedState]);

  const linkMutation = useMutation({
    mutationFn: (payload) => linkClientWhatsappInstance(clientId, payload),
    onSuccess: (response) => {
      toast.success(
        translate(
          "editClient.whatsapp.linkSuccess",
          "WhatsApp instance linked successfully"
        )
      );
      const linked = readLinkedWhatsapp(response) ?? response?.data?.linked_automated_whatsapp;
      applyLinkedState(
        linked ?? {
          whatsapp_instance_id: form.whatsapp_instance_id,
          whatsapp_number: form.whatsapp_number,
        }
      );
      void refetchProfile();
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          translate("editClient.whatsapp.linkFailed", "Failed to link WhatsApp instance")
        )
      );
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: () => unlinkClientWhatsappInstance(clientId),
    onSuccess: () => {
      toast.success(
        translate(
          "editClient.whatsapp.unlinkSuccess",
          "WhatsApp instance unlinked"
        )
      );
      applyLinkedState(null);
      setUnlinkOpen(false);
      void refetchProfile();
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          translate(
            "editClient.whatsapp.unlinkFailed",
            "Failed to unlink WhatsApp instance"
          )
        )
      );
    },
  });

  const setField = (key) => (e) => {
    const value = e?.target?.value ?? "";
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = () => {
    const errors = {};
    if (!form.whatsapp_instance_id.trim()) {
      errors.whatsapp_instance_id = translate(
        "editClient.whatsapp.instanceIdRequired",
        "UltraMsg Instance ID is required"
      );
    }
    if (!form.whatsapp_number.trim()) {
      errors.whatsapp_number = translate(
        "editClient.whatsapp.numberRequired",
        "WhatsApp number is required"
      );
    }
    if (!form.whatsapp_instance_token.trim()) {
      errors.whatsapp_instance_token = translate(
        "editClient.whatsapp.tokenRequired",
        "UltraMsg token is required"
      );
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLinkSave = (e) => {
    e.preventDefault();
    if (!validate()) return;

    linkMutation.mutate({
      whatsapp_instance_id: form.whatsapp_instance_id.trim(),
      whatsapp_number: form.whatsapp_number.trim(),
      whatsapp_instance_token: form.whatsapp_instance_token.trim(),
    });
  };

  const tokenPlaceholder = isLinked
    ? translate(
        "editClient.whatsapp.tokenSavedPlaceholder",
        "Token saved — enter a new one to replace"
      )
    : translate("editClient.whatsapp.tokenPlaceholder", "••••••••••••••••");

  const isBusy = profileLoading || linkMutation.isPending || unlinkMutation.isPending;

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
            {isLinked && (
              <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full shrink-0">
                {translate("editClient.whatsapp.linkedBadge", "Linked")}
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
            {profileLoading ? (
              <div className="flex items-center justify-center py-6 text-gray-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">
                  {translate("editClient.whatsapp.loading", "Loading WhatsApp settings…")}
                </span>
              </div>
            ) : (
              <form onSubmit={handleLinkSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <LenaTextField
                    label={translate(
                      "editClient.whatsapp.instanceIdLabel",
                      "UltraMsg Instance ID"
                    )}
                    name="whatsapp_instance_id"
                    value={form.whatsapp_instance_id}
                    onChange={setField("whatsapp_instance_id")}
                    placeholder={translate(
                      "editClient.whatsapp.instanceIdPlaceholder",
                      "instance177433"
                    )}
                    required
                    disabled={isBusy}
                    error={!!fieldErrors.whatsapp_instance_id}
                    errorMessage={fieldErrors.whatsapp_instance_id}
                    autoComplete="off"
                  />
                  <LenaTextField
                    label={translate(
                      "editClient.whatsapp.numberLabel",
                      "WhatsApp Number"
                    )}
                    name="whatsapp_number"
                    type="tel"
                    value={form.whatsapp_number}
                    onChange={setField("whatsapp_number")}
                    placeholder={translate(
                      "editClient.whatsapp.numberPlaceholder",
                      "+201055585339"
                    )}
                    required
                    disabled={isBusy}
                    error={!!fieldErrors.whatsapp_number}
                    errorMessage={fieldErrors.whatsapp_number}
                    autoComplete="tel"
                  />
                </div>

                <LenaTextField
                  label={translate(
                    "editClient.whatsapp.tokenLabel",
                    "UltraMsg Token"
                  )}
                  name="whatsapp_instance_token"
                  type="password"
                  value={form.whatsapp_instance_token}
                  onChange={setField("whatsapp_instance_token")}
                  placeholder={tokenPlaceholder}
                  required
                  disabled={isBusy}
                  error={!!fieldErrors.whatsapp_instance_token}
                  errorMessage={fieldErrors.whatsapp_instance_token}
                  autoComplete="new-password"
                  helperText={
                    isLinked
                      ? translate(
                          "editClient.whatsapp.tokenHelperLinked",
                          "A token is already saved. Enter a new token to replace it."
                        )
                      : undefined
                  }
                />

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  {isLinked && (
                    <button
                      type="button"
                      onClick={() => setUnlinkOpen(true)}
                      disabled={isBusy}
                      className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {translate("editClient.whatsapp.unlinkButton", "Unlink")}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-60 disabled:pointer-events-none inline-flex items-center gap-2"
                  >
                    {linkMutation.isPending && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {isLinked
                      ? translate(
                          "editClient.whatsapp.updateButton",
                          "Update WhatsApp"
                        )
                      : translate(
                          "editClient.whatsapp.linkButton",
                          "Link WhatsApp"
                        )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={unlinkOpen}
        onClose={() => setUnlinkOpen(false)}
        onConfirm={() => unlinkMutation.mutate()}
        title={translate(
          "editClient.whatsapp.unlinkConfirmTitle",
          "Remove WhatsApp integration?"
        )}
        message={translate(
          "editClient.whatsapp.unlinkConfirmMessage",
          "Remove WhatsApp integration for this client?"
        )}
        confirmLabel={translate("editClient.whatsapp.unlinkConfirmButton", "Remove")}
        cancelLabel={translate("buttons.cancel", "Cancel")}
      />
    </>
  );
}
