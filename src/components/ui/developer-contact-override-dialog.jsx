"use client";

import { useState, useEffect, useCallback } from "react";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { LenaTextField } from "@/components/ui/inputs";
import { PhoneField } from "@/components/phone/PhoneField";
import { useI18n } from "@/hooks/useI18n";
import {
  getDeveloperContactOverride,
  setDeveloperContactOverride,
  deleteDeveloperContactOverride,
} from "@/utils/api";
import toast from "react-hot-toast";

function extractContact(res) {
  if (!res || res.error) return null;
  const d = res.data ?? res;
  if (d && typeof d === "object" && !Array.isArray(d)) {
    if (d.data && typeof d.data === "object") return d.data;
    return d;
  }
  return null;
}

export default function DeveloperContactOverrideDialog({
  isOpen,
  onClose,
  clientId,
  developerId,
  developerName,
  onSaved,
}) {
  const { t, locale, translate } = useI18n();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sales_name: "",
    sales_email: "",
    sales_phone: "",
    whatsapp: "",
  });

  const load = useCallback(async () => {
    if (!clientId || !developerId) return;
    setLoading(true);
    try {
      const res = await getDeveloperContactOverride(clientId, developerId);
      const c = extractContact(res);
      if (res?.error) {
        if (res.code === 403 || res.code === 404) {
          setForm({
            sales_name: "",
            sales_email: "",
            sales_phone: "",
            whatsapp: "",
          });
        } else {
          toast.error(String(res.error));
        }
      } else if (c) {
        setForm({
          sales_name: c.sales_name ?? "",
          sales_email: c.sales_email ?? "",
          sales_phone: c.sales_phone ?? "",
          whatsapp: c.whatsapp ?? "",
        });
      }
    } catch (e) {
      console.error(e?.message ?? e);
      toast.error(translate("common.error"));
    } finally {
      setLoading(false);
    }
  }, [clientId, developerId, locale, translate]);

  useEffect(() => {
    if (isOpen && clientId && developerId) {
      void load();
    }
  }, [isOpen, clientId, developerId, load]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!clientId || !developerId) return;
    setSaving(true);
    try {
      const res = await setDeveloperContactOverride(clientId, developerId, {
        sales_name: form.sales_name?.trim() || undefined,
        sales_email: form.sales_email?.trim() || undefined,
        sales_phone: form.sales_phone?.trim() || undefined,
        whatsapp: form.whatsapp?.trim() || undefined,
      });
      if (res?.error) {
        toast.error(String(res.error));
        return;
      }
      const c = extractContact(res) ?? form;
      toast.success(
        translate("developerPage.contactOverrideSaved")
      );
      onSaved?.(c);
      onClose();
    } catch (err) {
      toast.error(
        err?.message || translate("developerPage.contactOverrideSaveFailed")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async () => {
    if (!clientId || !developerId) return;
    if (
      !window.confirm(
        translate("developerPage.contactOverrideRevertConfirm")
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const res = await deleteDeveloperContactOverride(clientId, developerId);
      if (res?.error) {
        toast.error(String(res.error));
        return;
      }
      toast.success(
        translate("developerPage.contactOverrideRemoved")
      );
      await load();
      onSaved?.(null);
      onClose();
    } catch (err) {
      toast.error(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  const titleBase =
    translate("developerPage.updateContactTitle") +
    (developerName ? ` — ${developerName}` : "");

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={titleBase}
      cancelLabel={translate("buttons.cancel")}
      onCancel={onClose}
      submitLabel={
        saving
          ? translate("common.saving")
          : translate("common.save")
      }
      onSubmit={handleSave}
      submitDisabled={loading || saving}
      submitLoading={saving}
      bodyClassName="max-h-[70vh] overflow-y-auto"
    >
      <p className="text-sm text-gray-600 mb-4">
        {translate("developerPage.updateContactBlurb")}
      </p>
      {loading ? (
        <p className="text-sm text-gray-500">
          {translate("common.loading")}
        </p>
      ) : (
        <div className="space-y-3">
          <LenaTextField
            name="sales_name"
            label={translate("formLabels.salesName")}
            value={form.sales_name}
            onChange={handleChange}
            autoComplete="name"
          />
          <LenaTextField
            name="sales_email"
            type="email"
            label={translate("formLabels.salesEmail")}
            value={form.sales_email}
            onChange={handleChange}
            autoComplete="email"
          />
          <PhoneField
            className="w-full"
            name="sales_phone"
            label={translate("formLabels.salesPhone")}
            value={form.sales_phone ?? ""}
            onChange={(next) =>
              setForm((prev) => ({ ...prev, sales_phone: next ?? "" }))
            }
            defaultCountry="EG"
            placeholder={translate("formLabels.salesPhone")}
          />
          <PhoneField
            className="w-full"
            name="whatsapp"
            label={translate("formLabels.whatsapp")}
            value={form.whatsapp ?? ""}
            onChange={(next) =>
              setForm((prev) => ({ ...prev, whatsapp: next ?? "" }))
            }
            defaultCountry="EG"
            placeholder={translate("formLabels.whatsapp")}
          />
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDeleteOverride}
              disabled={saving}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
          {translate("developerPage.revertContactOverride")}
            </button>
          </div>
        </div>
      )}
    </UnifiedDialog>
  );
}
