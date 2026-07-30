import {
  buildCanonicalUnitShareUrl,
  resolveUnitCodeFromListItem,
  resolveUnitIdFromListItem,
} from "@/lib/units/unit-share-links";
import { resolveWhatsappRecipientFields } from "@/lib/whatsapp-recipient";

/** Default WhatsApp body for bulk availability checks — always Arabic. */
export const BULK_AVAILABILITY_DEFAULT_MESSAGE_AR =
  "السلام عليكم .. معانا عميل مهتم بشقة حضرتك.. امتى متاح ميعاد للمعاينة؟";

function getUnitSelectionId(unit) {
  return (
    resolveUnitIdFromListItem(unit) ||
    resolveUnitCodeFromListItem(unit) ||
    null
  );
}

/** Owner WhatsApp phone from unit.owner_mobile only — no other field fallbacks. */
function extractOwnerPhone(unit) {
  return String(unit.owner_mobile ?? unit.ownerMobile ?? "").trim();
}

/**
 * Build a units list row into a WhatsApp recipient for bulk availability checks.
 * Skips units with missing or invalid owner_mobile (backend 422 on bad phones).
 *
 * @param {object} unit
 * @param {string|null|undefined} clientId
 * @returns {{ phone_number?: string, chat_id?: string, user_name: string, unitLink: string | null, unitId: string } | null}
 */
export function unitToWhatsappRecipient(unit, clientId = null) {
  if (!unit) return null;

  const unitId = getUnitSelectionId(unit);
  if (!unitId) return null;

  const ownerPhone = extractOwnerPhone(unit);
  if (!ownerPhone) return null;

  const resolved = resolveWhatsappRecipientFields({
    phone_number: ownerPhone,
  });
  if (!resolved) return null;

  const ownerName = String(unit.owner_name ?? unit.ownerName ?? "").trim();
  const unitCode = resolveUnitCodeFromListItem(unit);
  const linkSegment = unitCode ?? unitId;
  const fallback = resolved.chat_id || resolved.phone_number || "";
  const listingClientId =
    (unit?.clientId != null && String(unit.clientId).trim()) ||
    (unit?.client_id != null && String(unit.client_id).trim()) ||
    clientId ||
    null;
  const unitLink = linkSegment
    ? buildCanonicalUnitShareUrl(linkSegment, listingClientId)
    : null;

  return {
    ...resolved,
    user_name: ownerName || unitCode || fallback,
    unitLink,
    unitId,
  };
}

export function getUnitSelectionIdFromListItem(unit) {
  return getUnitSelectionId(unit);
}

export function isUnitSelectableForBulkWhatsapp(unit) {
  return getUnitSelectionId(unit) != null;
}
