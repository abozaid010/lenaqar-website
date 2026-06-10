import { phoneToE164 } from "@/components/phone/phone-utils";

const PATCHABLE_FIELDS = [
  "client_name",
  "full_name",
  "email",
  "phone_number",
  "address",
  "crm_link",
  "google_map_link",
  "logo_url",
  "client_type",
  "is_active",
  "price_percentage",
  "accurate_queries_level",
  "sharing_policy",
  "developer_sharing_policy",
  "projects_sharing_policy",
  "module_actions",
];

function normalizeFieldValue(key, value) {
  if (key === "phone_number") {
    const raw = typeof value === "string" ? value.trim() : "";
    return phoneToE164(raw, "EG") || raw || "";
  }
  if (key === "price_percentage") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (key === "accurate_queries_level") {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : 0;
  }
  if (key === "logo_url") {
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed || null;
  }
  if (key === "module_actions") {
    return value && typeof value === "object" ? value : {};
  }
  if (key === "is_active") {
    return Boolean(value);
  }
  return value ?? "";
}

function fieldValuesEqual(key, a, b) {
  if (key === "module_actions") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}

/**
 * Build a PATCH body with only fields that changed vs. the dialog's initial state.
 * WhatsApp linking is handled separately via PUT/DELETE /client/whatsapp-instance.
 */
export function buildAdminClientPatchPayload(initial, current) {
  const patch = {};

  for (const key of PATCHABLE_FIELDS) {
    const next = normalizeFieldValue(key, current[key]);
    const prev = normalizeFieldValue(key, initial[key]);
    if (!fieldValuesEqual(key, next, prev)) {
      patch[key] = next;
    }
  }

  return patch;
}

/** Normalized snapshot of all admin-editable client fields (for full PATCH on save). */
export function buildAdminClientFullPayload(form) {
  const payload = {};

  for (const key of PATCHABLE_FIELDS) {
    payload[key] = normalizeFieldValue(key, form[key]);
  }

  return payload;
}
