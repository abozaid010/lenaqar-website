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
 * @param {object} initial - Snapshot when the dialog opened
 * @param {object} current - Current form state
 * @param {object|null|undefined} linkedAutomatedWhatsappPatch - undefined = omit; null = unlink; object = link/update
 */
export function buildAdminClientPatchPayload(
  initial,
  current,
  linkedAutomatedWhatsappPatch
) {
  const patch = {};

  for (const key of PATCHABLE_FIELDS) {
    const next = normalizeFieldValue(key, current[key]);
    const prev = normalizeFieldValue(key, initial[key]);
    if (!fieldValuesEqual(key, next, prev)) {
      patch[key] = next;
    }
  }

  if (linkedAutomatedWhatsappPatch !== undefined) {
    patch.linked_automated_whatsapp = linkedAutomatedWhatsappPatch;
  }

  return patch;
}
