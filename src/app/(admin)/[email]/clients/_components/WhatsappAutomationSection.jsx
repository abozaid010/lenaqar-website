"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { PhoneField } from "@/components/phone/PhoneField";
import { phoneToE164 } from "@/components/phone/phone-utils";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import { useI18n } from "@/hooks/useI18n";

const EMPTY_WHATSAPP_FORM = {
  whatsapp_instance_id: "",
  whatsapp_number: "",
  whatsapp_instance_token: "",
};

/** Shown when a token exists server-side but is not returned in API responses. */
const SAVED_TOKEN_MASK = "••••••••••••••••";

function normalizeWhatsappPhone(raw) {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return phoneToE164(trimmed, "EG") || trimmed;
}

function snapshotForm(form) {
  return {
    whatsapp_instance_id: form.whatsapp_instance_id?.trim() ?? "",
    whatsapp_number: form.whatsapp_number?.trim() ?? "",
    whatsapp_instance_token: form.whatsapp_instance_token?.trim() ?? "",
  };
}

function buildBaselineFromLinked(linked) {
  if (!linked) return null;
  return {
    whatsapp_instance_id: linked.whatsapp_instance_id ?? "",
    whatsapp_number: normalizeWhatsappPhone(linked.whatsapp_number),
    hasSavedToken: true,
  };
}

const WhatsappAutomationSection = forwardRef(function WhatsappAutomationSection(
  { initialLinkedWhatsapp = null, enabled = true },
  ref
) {
  const { translate } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const [form, setForm] = useState(EMPTY_WHATSAPP_FORM);
  const [isLinked, setIsLinked] = useState(false);
  const [hasSavedToken, setHasSavedToken] = useState(false);
  const [tokenDirty, setTokenDirty] = useState(false);
  const [pendingUnlink, setPendingUnlink] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const baselineRef = useRef(null);
  const initialSyncKeyRef = useRef(null);

  const applyLinkedState = useCallback((linked, { clearToken = true } = {}) => {
    if (linked) {
      const instanceId = linked.whatsapp_instance_id ?? "";
      const phone = normalizeWhatsappPhone(linked.whatsapp_number);
      const apiToken =
        typeof linked.whatsapp_instance_token === "string"
          ? linked.whatsapp_instance_token.trim()
          : "";

      setIsLinked(true);
      setHasSavedToken(Boolean(apiToken) || true);
      setTokenDirty(false);
      setPendingUnlink(false);

      setForm((prev) => {
        const token = clearToken ? apiToken || "" : prev.whatsapp_instance_token;
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

      baselineRef.current = buildBaselineFromLinked(linked);
    } else {
      setIsLinked(false);
      setHasSavedToken(false);
      setTokenDirty(false);
      baselineRef.current = null;

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

  const initialSyncKey = enabled
    ? `${initialLinkedWhatsapp?.whatsapp_instance_id ?? ""}:${initialLinkedWhatsapp?.whatsapp_number ?? ""}:${initialLinkedWhatsapp ? "1" : "0"}`
    : null;

  useEffect(() => {
    if (!enabled) {
      initialSyncKeyRef.current = null;
      setForm(EMPTY_WHATSAPP_FORM);
      setIsLinked(false);
      setHasSavedToken(false);
      setTokenDirty(false);
      setPendingUnlink(false);
      baselineRef.current = null;
      setFieldErrors({});
      return;
    }
    if (initialSyncKey == null || initialSyncKeyRef.current === initialSyncKey) {
      return;
    }
    initialSyncKeyRef.current = initialSyncKey;
    applyLinkedState(initialLinkedWhatsapp, { clearToken: true });
  }, [enabled, initialSyncKey, initialLinkedWhatsapp, applyLinkedState]);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const hasWhatsappDraft = useCallback(() => {
    const snap = snapshotForm(form);
    return Boolean(
      snap.whatsapp_instance_id ||
        snap.whatsapp_number ||
        snap.whatsapp_instance_token ||
        isLinked ||
        pendingUnlink
    );
  }, [form, isLinked, pendingUnlink]);

  const hasWhatsappChanges = useCallback(() => {
    if (pendingUnlink) return true;
    if (!hasWhatsappDraft()) return false;

    const snap = snapshotForm(form);
    const baseline = baselineRef.current;

    if (!baseline) {
      return Boolean(
        snap.whatsapp_instance_id ||
          snap.whatsapp_number ||
          snap.whatsapp_instance_token
      );
    }

    if (snap.whatsapp_instance_id !== baseline.whatsapp_instance_id) return true;
    if (snap.whatsapp_number !== baseline.whatsapp_number) return true;
    if (tokenDirty && snap.whatsapp_instance_token) return true;
    if (!isLinked && snap.whatsapp_instance_token) return true;

    return false;
  }, [form, hasWhatsappDraft, isLinked, pendingUnlink, tokenDirty]);

  const validate = useCallback(() => {
    const errors = {};
    const instanceId = form.whatsapp_instance_id.trim();
    const phoneE164 =
      phoneToE164(form.whatsapp_number, "EG") || form.whatsapp_number.trim();
    const token = form.whatsapp_instance_token.trim();
    const needsWhatsappSave = hasWhatsappChanges();

    if (!needsWhatsappSave) {
      setFieldErrors({});
      return true;
    }

    if (pendingUnlink) {
      setFieldErrors({});
      return true;
    }

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

    const tokenRequired = !isLinked || tokenDirty;
    if (tokenRequired && !token) {
      errors.whatsapp_instance_token = translate(
        "editClient.whatsapp.tokenRequired",
        "UltraMsg token is required"
      );
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form, hasWhatsappChanges, isLinked, pendingUnlink, tokenDirty, translate]);

  const getPatchValue = useCallback(() => {
    if (!hasWhatsappChanges()) return undefined;
    if (pendingUnlink) return null;

    const phoneE164 =
      phoneToE164(form.whatsapp_number, "EG") || form.whatsapp_number.trim();
    const token = form.whatsapp_instance_token.trim();

    const linked = {
      whatsapp_instance_id: form.whatsapp_instance_id.trim(),
      whatsapp_number: phoneE164,
    };

    if (token && token !== SAVED_TOKEN_MASK) {
      linked.whatsapp_instance_token = token;
    }

    return linked;
  }, [form, hasWhatsappChanges, pendingUnlink]);

  const syncFromServer = useCallback((linked) => {
    setPendingUnlink(false);
    applyLinkedState(linked, { clearToken: true });
    const syncKey = linked
      ? `${linked.whatsapp_instance_id ?? ""}:${linked.whatsapp_number ?? ""}:1`
      : ":::0";
    initialSyncKeyRef.current = syncKey;
  }, [applyLinkedState]);

  const handleUnlinkConfirm = () => {
    setPendingUnlink(true);
    setUnlinkOpen(false);
    applyLinkedState(null, { clearToken: true });
  };

  useImperativeHandle(
    ref,
    () => ({
      validate,
      getPatchValue,
      syncFromServer,
      hasChanges: hasWhatsappChanges,
    }),
    [validate, getPatchValue, syncFromServer, hasWhatsappChanges]
  );

  const showSavedTokenMask =
    isLinked && hasSavedToken && !tokenDirty && !form.whatsapp_instance_token.trim();

  const tokenInputValue = showSavedTokenMask
    ? SAVED_TOKEN_MASK
    : form.whatsapp_instance_token;

  const tokenPlaceholder = isLinked
    ? translate(
        "editClient.whatsapp.tokenSavedPlaceholder",
        "Token saved — enter a new one to replace"
      )
    : translate("editClient.whatsapp.tokenPlaceholder", "••••••••••••••••");

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
            {isLinked && !pendingUnlink && (
              <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full shrink-0">
                {translate("editClient.whatsapp.linkedBadge", "Linked")}
              </span>
            )}
            {pendingUnlink && (
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
                    setPendingUnlink(false);
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
                    setPendingUnlink(false);
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
                  setPendingUnlink(false);
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
                required={!isLinked || tokenDirty}
                error={!!fieldErrors.whatsapp_instance_token}
                errorMessage={fieldErrors.whatsapp_instance_token}
                autoComplete="new-password"
                helperText={
                  showSavedTokenMask || (isLinked && hasSavedToken)
                    ? translate(
                        "editClient.whatsapp.tokenHelperLinked",
                        "A token is already saved. Enter a new token to replace it."
                      )
                    : undefined
                }
              />

              {isLinked && !pendingUnlink && (
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setUnlinkOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    {translate("editClient.whatsapp.unlinkButton", "Unlink")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        isOpen={unlinkOpen}
        onClose={() => setUnlinkOpen(false)}
        onConfirm={handleUnlinkConfirm}
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
});

WhatsappAutomationSection.displayName = "WhatsappAutomationSection";

export default WhatsappAutomationSection;
