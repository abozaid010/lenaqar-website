"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { PhoneField } from "@/components/phone/PhoneField";
import { phoneToE164 } from "@/components/phone/phone-utils";
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

function normalizeWhatsappPhone(raw) {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return phoneToE164(trimmed, "EG") || trimmed;
}

export default function WhatsappAutomationSection({ clientId, enabled = true }) {
  const { translate } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const [form, setForm] = useState(EMPTY_WHATSAPP_FORM);
  const [isLinked, setIsLinked] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const profileSyncKeyRef = useRef(null);

  const {
    data: profileResponse,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["clientProfile", clientId, "whatsapp"],
    queryFn: () => getClientProfile(clientId),
    enabled: Boolean(enabled && clientId),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const linkedFromProfile = useMemo(
    () => (profileResponse ? readLinkedWhatsapp(profileResponse) : null),
    [
      profileResponse,
      profileResponse?.data?.linked_automated_whatsapp?.whatsapp_instance_id,
      profileResponse?.data?.linked_automated_whatsapp?.whatsapp_number,
    ]
  );

  const linkedSyncKey = useMemo(() => {
    if (!enabled || profileResponse == null) return null;
    if (!linkedFromProfile) return `${clientId}:::0`;
    return `${clientId}:${linkedFromProfile.whatsapp_instance_id ?? ""}:${linkedFromProfile.whatsapp_number ?? ""}:1`;
  }, [enabled, clientId, profileResponse, linkedFromProfile]);

  const applyLinkedState = useCallback((linked, { clearToken = true } = {}) => {
    if (linked) {
      const instanceId = linked.whatsapp_instance_id ?? "";
      const phone = normalizeWhatsappPhone(linked.whatsapp_number);

      setIsLinked((prev) => (prev ? prev : true));
      setForm((prev) => {
        const token = clearToken ? "" : prev.whatsapp_instance_token;
        if (
          prev.whatsapp_instance_id === instanceId &&
          prev.whatsapp_number === phone &&
          prev.whatsapp_instance_token === token
        ) {
          return prev;
        }
        return {
          whatsapp_instance_id: instanceId,
          whatsapp_number: phone,
          whatsapp_instance_token: token,
        };
      });
    } else {
      setIsLinked((prev) => (prev ? false : prev));
      setForm((prev) => {
        if (
          !prev.whatsapp_instance_id &&
          !prev.whatsapp_number &&
          !prev.whatsapp_instance_token
        ) {
          return prev;
        }
        return EMPTY_WHATSAPP_FORM;
      });
    }
    setFieldErrors((prev) => (Object.keys(prev).length === 0 ? prev : {}));
  }, []);

  useEffect(() => {
    profileSyncKeyRef.current = null;
    if (!enabled) {
      setForm((prev) => {
        if (
          !prev.whatsapp_instance_id &&
          !prev.whatsapp_number &&
          !prev.whatsapp_instance_token
        ) {
          return prev;
        }
        return EMPTY_WHATSAPP_FORM;
      });
      setIsLinked((prev) => (prev ? false : prev));
      setFieldErrors((prev) => (Object.keys(prev).length === 0 ? prev : {}));
    }
  }, [enabled, clientId]);

  useEffect(() => {
    if (!enabled || profileLoading || linkedSyncKey == null) return;
    if (profileSyncKeyRef.current === linkedSyncKey) return;
    profileSyncKeyRef.current = linkedSyncKey;
    applyLinkedState(linkedFromProfile, { clearToken: true });
  }, [enabled, profileLoading, linkedSyncKey, linkedFromProfile, applyLinkedState]);

  const linkMutation = useMutation({
    mutationFn: (payload) => linkClientWhatsappInstance(clientId, payload),
    onSuccess: (response) => {
      toast.success(
        translate(
          "editClient.whatsapp.linkSuccess",
          "WhatsApp instance linked successfully"
        )
      );
      const linked =
        readLinkedWhatsapp(response) ?? response?.data?.linked_automated_whatsapp;
      const nextLinked =
        linked ?? {
          whatsapp_instance_id: form.whatsapp_instance_id,
          whatsapp_number: form.whatsapp_number,
        };
      const syncKey = `${clientId}:${nextLinked?.whatsapp_instance_id ?? ""}:${nextLinked?.whatsapp_number ?? ""}:1`;
      profileSyncKeyRef.current = syncKey;
      applyLinkedState(nextLinked, { clearToken: true });
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
      profileSyncKeyRef.current = `${clientId}:::0`;
      applyLinkedState(null, { clearToken: true });
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

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const errors = {};
    const instanceId = form.whatsapp_instance_id.trim();
    const phoneE164 =
      phoneToE164(form.whatsapp_number, "EG") || form.whatsapp_number.trim();
    const token = form.whatsapp_instance_token.trim();

    if (!instanceId) {
      errors.whatsapp_instance_id = translate(
        "editClient.whatsapp.instanceIdRequired",
        "UltraMsg Instance ID is required"
      );
    }
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
    if (!token) {
      errors.whatsapp_instance_token = translate(
        "editClient.whatsapp.tokenRequired",
        "UltraMsg token is required"
      );
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLinkSave = () => {
    if (!validate()) return;

    const phoneE164 =
      phoneToE164(form.whatsapp_number, "EG") || form.whatsapp_number.trim();
    const token = form.whatsapp_instance_token.trim();

    linkMutation.mutate({
      whatsapp_instance_id: form.whatsapp_instance_id.trim(),
      whatsapp_number: phoneE164,
      whatsapp_instance_token: token,
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
                    disabled={isBusy}
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
                    disabled={isBusy}
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
                  value={form.whatsapp_instance_token}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      whatsapp_instance_token: e.target.value,
                    }));
                    clearFieldError("whatsapp_instance_token");
                  }}
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
                    type="button"
                    onClick={handleLinkSave}
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
              </div>
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
