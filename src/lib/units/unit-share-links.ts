import { SITE_URL } from '@/app/metadata';
import { formatPhoneForWhatsApp } from '@/utils/phone-utils';

/**
 * Parse and sanitize a unit code from a dynamic route param.
 * Returns null when empty or unsafe for use as a path segment.
 */
export function normalizeUnitCodeParam(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const trimmed = decoded.trim();
  if (!trimmed || trimmed.includes('..') || trimmed.includes('/')) return null;
  return trimmed;
}

/** Encode a unit code for use in URL path segments. */
export function encodeUnitCodeForPath(code: string): string {
  return encodeURIComponent(code);
}

type UnitListLinkFields = {
  code?: unknown;
  unitId?: unknown;
  unit_id?: unknown;
  id?: unknown;
  clientId?: unknown;
  client_id?: unknown;
};

/** Safely read a unit code from list/API payloads (string or number). */
export function resolveUnitCodeFromListItem(
  unit: UnitListLinkFields | null | undefined
): string | null {
  if (unit?.code == null) return null;
  const trimmed = String(unit.code).trim();
  return trimmed || null;
}

/** Safely read a unit id from list/API payloads. */
export function resolveUnitIdFromListItem(
  unit: UnitListLinkFields | null | undefined
): string | null {
  const raw = unit?.unitId ?? unit?.unit_id ?? unit?.id;
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  return trimmed || null;
}

/**
 * Detail href for a unit card: prefers code, falls back to unitId (legacy route resolves by id).
 * Returns null when neither identifier is available.
 *
 * Always uses the canonical `/{listingClientId}/units/{code}` path when a clientId is known.
 * `readonly` is kept for API compat but no longer switches to /allProberties.
 */
export function buildUnitDetailHrefFromListItem(
  unit: UnitListLinkFields | null | undefined,
  opts?: {
    readonly?: boolean;
    clientId?: string | null;
    queryParams?: string;
  }
): string | null {
  const code = resolveUnitCodeFromListItem(unit);
  const unitId = resolveUnitIdFromListItem(unit);
  const segment = code ?? unitId;
  if (!segment) return null;

  const listingClientId =
    (unit?.clientId != null && String(unit.clientId).trim()) ||
    (unit?.client_id != null && String(unit.client_id).trim()) ||
    opts?.clientId ||
    null;

  const path = buildAdminUnitDetailPath(segment, listingClientId);
  return path + (opts?.queryParams || '');
}

/**
 * @deprecated Prefer buildCanonicalUnitShareUrl — kept as alias for redirects/legacy callers.
 * Public marketing share URL historically pointed at /allProberties/{code}.
 */
export function buildPublicUnitShareUrl(code: string, listingClientId?: string | null): string {
  return buildCanonicalUnitShareUrl(code, listingClientId);
}

/** Relative public detail path — now aliases to canonical admin path when clientId known. */
export function buildPublicUnitDetailPath(
  code: string,
  listingClientId?: string | null
): string {
  const normalized = normalizeUnitCodeParam(code);
  if (!normalized) return listingClientId ? `/${listingClientId}/units` : '/allProberties';
  if (listingClientId) {
    return buildAdminUnitDetailPath(normalized, listingClientId);
  }
  // Without listing clientId, keep legacy alias path (redirect page resolves clientId).
  return `/allProberties/${encodeUnitCodeForPath(normalized)}`;
}

/** Admin CRM detail path: /{clientId}/units/{code} or /units/{code} */
export function buildAdminUnitDetailPath(
  code: string,
  clientId?: string | null
): string {
  const normalized = normalizeUnitCodeParam(code);
  if (!normalized) return clientId ? `/${clientId}/units` : '/units';
  const segment = encodeUnitCodeForPath(normalized);
  return clientId ? `/${clientId}/units/${segment}` : `/units/${segment}`;
}

/** Admin edit path: /{clientId}/units/{code}/edit or /units/{code}/edit */
export function buildAdminUnitEditPath(
  code: string,
  clientId?: string | null
): string {
  const detail = buildAdminUnitDetailPath(code, clientId);
  return `${detail}/edit`;
}

/** Full canonical share URL: https://example.com/{listingClientId}/units/{code} */
export function buildAdminUnitShareUrl(
  code: string,
  clientId?: string | null
): string {
  return `${SITE_URL}${buildAdminUnitDetailPath(code, clientId)}`;
}

/** Canonical permanent share URL (same as buildAdminUnitShareUrl). */
export function buildCanonicalUnitShareUrl(
  code: string,
  listingClientId?: string | null
): string {
  return buildAdminUnitShareUrl(code, listingClientId);
}

/** Arabic prefix for the pre-filled WhatsApp message when sharing a unit. */
export const UNIT_WHATSAPP_SHARE_MESSAGE_PREFIX = 'تفاصيل';

/** Build the full WhatsApp message for a unit (Arabic + reference code). */
export function buildUnitWhatsappShareMessage(code: string): string {
  const normalized = normalizeUnitCodeParam(code);
  if (!normalized) return UNIT_WHATSAPP_SHARE_MESSAGE_PREFIX;
  return `${UNIT_WHATSAPP_SHARE_MESSAGE_PREFIX} ${normalized}`;
}

/** Branded public share page that redirects to WhatsApp with the default message. */
export function buildPublicUnitWhatsAppPageUrl(code: string): string {
  const normalized = normalizeUnitCodeParam(code);
  if (!normalized) return `${SITE_URL}/allProberties`;
  return `${SITE_URL}/allProberties/${encodeUnitCodeForPath(normalized)}/whatsapp`;
}

/** Direct WhatsApp deep link (wa.me) with pre-filled message. */
export function buildUnitWhatsAppShareUrl(
  whatsappNumber: string,
  code: string
): string {
  return formatPhoneForWhatsApp(
    whatsappNumber,
    buildUnitWhatsappShareMessage(code)
  );
}

export function buildUnitShareLinks(opts: {
  code: string;
  listingClientId?: string | null;
  whatsappNumber?: string | null;
}): {
  websiteUrl: string;
  whatsappUrl: string | null;
  whatsappDirectUrl: string | null;
} {
  const websiteUrl = buildCanonicalUnitShareUrl(opts.code, opts.listingClientId);
  const whatsappUrl = normalizeUnitCodeParam(opts.code)
    ? buildPublicUnitWhatsAppPageUrl(opts.code)
    : null;
  const whatsappDirectUrl = opts.whatsappNumber
    ? buildUnitWhatsAppShareUrl(opts.whatsappNumber, opts.code)
    : null;
  return { websiteUrl, whatsappUrl, whatsappDirectUrl };
}
