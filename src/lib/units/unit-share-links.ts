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

  const path = opts?.readonly
    ? buildPublicUnitDetailPath(segment)
    : buildAdminUnitDetailPath(segment, opts?.clientId);
  return path + (opts?.queryParams || '');
}

/** Public marketing share URL: https://lenaai.net/allProberties/{code} */
export function buildPublicUnitShareUrl(code: string): string {
  const normalized = normalizeUnitCodeParam(code);
  if (!normalized) return `${SITE_URL}/allProberties`;
  return `${SITE_URL}/allProberties/${encodeUnitCodeForPath(normalized)}`;
}

/** Relative public detail path for in-app navigation. */
export function buildPublicUnitDetailPath(code: string): string {
  const normalized = normalizeUnitCodeParam(code);
  if (!normalized) return '/allProberties';
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

/** Full admin CRM share URL: https://example.com/{clientId}/units/{code} */
export function buildAdminUnitShareUrl(
  code: string,
  clientId?: string | null
): string {
  return `${SITE_URL}${buildAdminUnitDetailPath(code, clientId)}`;
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
  whatsappNumber?: string | null;
}): {
  websiteUrl: string;
  whatsappUrl: string | null;
  whatsappDirectUrl: string | null;
} {
  const websiteUrl = buildPublicUnitShareUrl(opts.code);
  const whatsappUrl = normalizeUnitCodeParam(opts.code)
    ? buildPublicUnitWhatsAppPageUrl(opts.code)
    : null;
  const whatsappDirectUrl = opts.whatsappNumber
    ? buildUnitWhatsAppShareUrl(opts.whatsappNumber, opts.code)
    : null;
  return { websiteUrl, whatsappUrl, whatsappDirectUrl };
}
