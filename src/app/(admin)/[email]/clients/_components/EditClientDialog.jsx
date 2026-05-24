"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { useClientPermissionSchema, useUpdateClient } from "@/hooks/use-clients-data";
import {
  getResolvedPermissionSchema,
  sanitizeModuleActions,
} from "@/lib/permission-schema";
import ModuleActionsSelector from "@/app/(admin)/clients/new/_components/ModuleActionsSelector";
import { useI18n } from "@/hooks/useI18n";
import ClientLogoUploader from "@/components/ui/inputs/client-logo-uploader";
import { PhoneField } from "@/components/phone/PhoneField";
import { phoneToE164 } from "@/components/phone/phone-utils";
import WhatsappAutomationSection from "./WhatsappAutomationSection";

const SHARING_OPTIONS = [
  { value: "only_my_units", label: "Only My Units" },
  { value: "pull_from_other_clients", label: "Pull From Other Clients" },
];
const DEVELOPER_SHARING_OPTIONS = [
  { value: "only_my_developers", label: "Only My Developers" },
  { value: "pull_from_other_clients", label: "Pull From Other Clients" },
];
const PROJECTS_SHARING_OPTIONS = [
  { value: "only_my_projects", label: "Only My Projects" },
  { value: "pull_from_other_clients", label: "Pull From Other Clients" },
];
const CLIENT_TYPE_OPTIONS = [
  { value: "developer", label: "Developer" },
  { value: "broker", label: "Broker" },
];

const SectionTitle = ({ children }) => (
  <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 mt-5 first:mt-0 border-b border-gray-100 pb-1">
    {children}
  </h3>
);

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    {children}
  </div>
);

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white";

const selectCls =
  "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary bg-white";

function normalizePhoneForField(raw) {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return phoneToE164(trimmed, "EG") || trimmed;
}

function buildInitialState(client) {
  return {
    client_name: client.client_name || "",
    full_name: client.full_name || "",
    email: client.email || "",
    phone_number: normalizePhoneForField(client.phone_number),
    address: client.address || "",
    crm_link: client.crm_link || "",
    google_map_link: client.google_map_link || "",
    logo_url:
      (typeof client.logo_url === "string" && client.logo_url.trim()) ||
      (typeof client.logo === "string" && client.logo.trim()) ||
      "",
    client_type: client.client_type || "developer",
    is_active: client.is_active ?? true,
    price_percentage: client.price_percentage ?? 0,
    accurate_queries_level: client.accurate_queries_level ?? 0,
    sharing_policy: client.sharing_policy || "only_my_units",
    developer_sharing_policy: client.developer_sharing_policy || "only_my_developers",
    projects_sharing_policy: client.projects_sharing_policy || "only_my_projects",
    module_actions: client.module_actions || {},
  };
}

export default function EditClientDialog({ client, isOpen, onClose }) {
  const { t } = useI18n();
  const [form, setForm] = useState(() => buildInitialState(client));
  const [logoUploading, setLogoUploading] = useState(false);
  const updateClient = useUpdateClient();
  const { rawSchema, isLoading: permissionSchemaLoading } =
    useClientPermissionSchema(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setForm(buildInitialState(client));
  }, [isOpen, client?.client_id]);

  useEffect(() => {
    if (!isOpen || permissionSchemaLoading || !rawSchema) return;
    const schema = getResolvedPermissionSchema(rawSchema);
    setForm((prev) => {
      const sanitized = sanitizeModuleActions(prev.module_actions, schema);
      const unchanged =
        JSON.stringify(sanitized) === JSON.stringify(prev.module_actions);
      if (unchanged) return prev;
      return { ...prev, module_actions: sanitized };
    });
  }, [isOpen, permissionSchemaLoading, rawSchema]);

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async () => {
    const payload = {
      ...form,
      phone_number:
        phoneToE164(form.phone_number, "EG") || form.phone_number?.trim() || "",
      logo_url: form.logo_url || null,
      price_percentage: parseFloat(form.price_percentage) || 0,
      accurate_queries_level: parseInt(form.accurate_queries_level) || 0,
    };

    try {
      await updateClient.mutateAsync({ clientId: client.client_id, payload });
      toast.success(t?.common?.clientUpdated);
      onClose();
    } catch {
      toast.error(t?.common?.failedToUpdateClient);
    }
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${client.client_name || client.client_id}`}
      submitLabel={t?.saveChangesButton || "Save Changes"}
      onSubmit={handleSubmit}
      submitLoading={updateClient.isPending || logoUploading}
      submitDisabled={updateClient.isPending || logoUploading}
      bodyClassName="space-y-4"
    >
      {/* Basic Info */}
      <SectionTitle>Basic Info</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Client Name">
          <input className={inputCls} value={form.client_name} onChange={set("client_name")} />
        </Field>
        <Field label="Full Name">
          <input className={inputCls} value={form.full_name} onChange={set("full_name")} />
        </Field>
        <Field label="Email">
          <input type="email" className={inputCls} value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Phone Number">
          <PhoneField
            className="w-full"
            name="phone_number"
            value={form.phone_number ?? ""}
            onChange={(next) =>
              setForm((prev) => ({ ...prev, phone_number: next ?? "" }))
            }
            defaultCountry="EG"
          />
        </Field>
        <Field label="Address">
          <input className={inputCls} value={form.address} onChange={set("address")} />
        </Field>
        <Field label="CRM Link">
          <input className={inputCls} value={form.crm_link} onChange={set("crm_link")} />
        </Field>
        <Field label="Google Map Link">
          <input className={inputCls} value={form.google_map_link} onChange={set("google_map_link")} />
        </Field>
      </div>

      <SectionTitle>Client Logo</SectionTitle>
      <Field label="Logo">
        <ClientLogoUploader
          key={`${client.client_id}-${form.logo_url || "no-logo"}`}
          clientId={client.client_id}
          initialLogoUrl={form.logo_url}
          onLogoUrlChange={(url) => setForm((prev) => ({ ...prev, logo_url: url }))}
          isUploading={logoUploading}
          setIsUploading={setLogoUploading}
        />
      </Field>

      {/* Settings */}
      <SectionTitle>Settings</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Client Type">
          <select className={selectCls} value={form.client_type} onChange={set("client_type")}>
            {CLIENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
            {!CLIENT_TYPE_OPTIONS.some((o) => o.value === form.client_type) && form.client_type ? (
              <option value={form.client_type}>{form.client_type}</option>
            ) : null}
          </select>
        </Field>
        <Field label="Price Percentage">
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.price_percentage}
            onChange={set("price_percentage")}
          />
        </Field>
        <Field label="Accurate Queries Level (0–4)">
          <input
            type="number"
            min={0}
            max={4}
            className={inputCls}
            value={form.accurate_queries_level}
            onChange={set("accurate_queries_level")}
          />
        </Field>
        <Field label="Active">
          <div className="flex items-center gap-2 h-9">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              className="h-4 w-4 accent-primary"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 cursor-pointer">
              {form.is_active ? "Active" : "Inactive"}
            </label>
          </div>
        </Field>
      </div>

      {/* Sharing */}
      <SectionTitle>Sharing Policy</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Units Sharing">
          <select className={selectCls} value={form.sharing_policy} onChange={set("sharing_policy")}>
            {SHARING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Developer Sharing">
          <select className={selectCls} value={form.developer_sharing_policy} onChange={set("developer_sharing_policy")}>
            {DEVELOPER_SHARING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Projects Sharing">
          <select className={selectCls} value={form.projects_sharing_policy} onChange={set("projects_sharing_policy")}>
            {PROJECTS_SHARING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Module Actions */}
      <SectionTitle>Module Permissions</SectionTitle>
      <ModuleActionsSelector
        moduleActions={form.module_actions}
        permissionSchema={rawSchema}
        isSchemaLoading={permissionSchemaLoading}
        onChange={(newActions) =>
          setForm((prev) => ({ ...prev, module_actions: newActions }))
        }
      />

      <WhatsappAutomationSection
        clientId={client.client_id}
        enabled={isOpen}
      />
    </UnifiedDialog>
  );
}
