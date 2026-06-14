import {
  buildAdminUnitShareUrl,
  resolveUnitCodeFromListItem,
  resolveUnitIdFromListItem,
} from "@/lib/units/unit-share-links";
import { resolveWhatsappRecipientFields } from "@/lib/whatsapp-recipient";

/** Default WhatsApp body for bulk availability checks — always Arabic. */
export const BULK_AVAILABILITY_DEFAULT_MESSAGE_AR =
  "مرحباً، أود الاستفسار عن توفر هذه الوحدة للإيجار ومتى يمكننا ترتيب معاينة للعقار.";

function getUnitSelectionId(unit) {
  return (
    resolveUnitIdFromListItem(unit) ||
    resolveUnitCodeFromListItem(unit) ||
    null
  );
}

/**
 * Build a units list row into a WhatsApp recipient for bulk availability checks.
 * Uses owner_mobile only; returns null when phone is missing or invalid.
 *
 * @param {object} unit
 * @param {string|null|undefined} clientId
 * @returns {{ phone_number?: string, chat_id?: string, user_name: string, unitLink: string | null, unitId: string } | null}
 */
export function unitToWhatsappRecipient(unit, clientId = null) {
  if (!unit) return null;

  const unitId = getUnitSelectionId(unit);
  if (!unitId) return null;

  const ownerPhone = String(unit.owner_mobile ?? unit.ownerMobile ?? "").trim();
  if (!ownerPhone) return null;

  const resolved = resolveWhatsappRecipientFields({
    phone_number: ownerPhone,
  });
  if (!resolved) return null;

  const ownerName = String(unit.owner_name ?? unit.ownerName ?? "").trim();
  const unitCode = resolveUnitCodeFromListItem(unit);
  const linkSegment = unitCode ?? unitId;
  const fallback = resolved.chat_id || resolved.phone_number || "";
  const unitLink = linkSegment
    ? buildAdminUnitShareUrl(linkSegment, clientId)
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

export function isUnitSelectableForBulkWhatsapp(unit, clientId = null) {
  return unitToWhatsappRecipient(unit, clientId) != null;
}
