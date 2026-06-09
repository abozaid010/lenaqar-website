import { redirect } from 'next/navigation';
import {
  getPublicUnitByCode,
  getPublicUnitById,
  getUnitByCode,
  getUnitById,
} from '@/lib/units/unit-api';
import {
  buildAdminUnitDetailPath,
  buildAdminUnitEditPath,
  buildPublicUnitDetailPath,
  encodeUnitCodeForPath,
  normalizeUnitCodeParam,
} from '@/lib/units/unit-share-links';
import { findUnitBySlug } from '@/lib/units/unit-url-utils';
import type { RawUnit } from '@/lib/units/unit-types';

function getUnitCode(rawUnit: RawUnit | null | undefined): string | null {
  const code = rawUnit?.code;
  return code && String(code).trim() ? String(code).trim() : null;
}

function shouldRedirectToCanonical(param: string, canonicalCode: string): boolean {
  const normalizedParam = normalizeUnitCodeParam(param);
  const normalizedCanonical = normalizeUnitCodeParam(canonicalCode);
  if (!normalizedCanonical) return false;
  return (
    normalizedParam !== normalizedCanonical &&
    encodeUnitCodeForPath(normalizedParam ?? param) !==
      encodeUnitCodeForPath(normalizedCanonical)
  );
}

async function resolveLegacyUnitId(param: string): Promise<string | null> {
  return findUnitBySlug(param);
}

/** Resolve a public unit by code; legacy slug/id params redirect to canonical code URL. */
export async function resolvePublicUnitByCodeParam(
  rawParam: string
): Promise<RawUnit | null> {
  const code = normalizeUnitCodeParam(rawParam);
  if (!code) return null;

  const byCode = await getPublicUnitByCode(code);
  if (byCode.status && byCode.data.units.length) {
    const rawUnit = byCode.data.units[0];
    const canonicalCode = getUnitCode(rawUnit);
    if (canonicalCode && shouldRedirectToCanonical(rawParam, canonicalCode)) {
      redirect(buildPublicUnitDetailPath(canonicalCode));
    }
    return rawUnit;
  }

  const legacyUnitId = await resolveLegacyUnitId(rawParam);
  if (!legacyUnitId) return null;

  const byId = await getPublicUnitById(legacyUnitId);
  if (!byId.status || !byId.data.units.length) return null;

  const rawUnit = byId.data.units[0];
  const canonicalCode = getUnitCode(rawUnit);
  if (canonicalCode) {
    redirect(buildPublicUnitDetailPath(canonicalCode));
  }
  return null;
}

/** Resolve an admin unit by code; legacy slug/id params redirect to canonical code URL. */
export async function resolveAdminUnitByCodeParam(
  rawParam: string,
  clientId?: string | null
): Promise<RawUnit | null> {
  const code = normalizeUnitCodeParam(rawParam);
  if (!code) return null;

  const byCode = await getUnitByCode(code);
  if (byCode.status && byCode.data.units.length) {
    const rawUnit = byCode.data.units[0];
    const canonicalCode = getUnitCode(rawUnit);
    if (canonicalCode && shouldRedirectToCanonical(rawParam, canonicalCode)) {
      redirect(buildAdminUnitDetailPath(canonicalCode, clientId));
    }
    return rawUnit;
  }

  const legacyUnitId = await resolveLegacyUnitId(rawParam);
  if (!legacyUnitId) return null;

  const byId = await getUnitById(legacyUnitId);
  if (!byId.status || !byId.data.units.length) return null;

  const rawUnit = byId.data.units[0];
  const canonicalCode = getUnitCode(rawUnit);
  if (canonicalCode) {
    redirect(buildAdminUnitDetailPath(canonicalCode, clientId));
  }
  return null;
}

/** Redirect legacy public slug/id URL to canonical /allProberties/{code}. */
export async function redirectLegacyToPublicCode(param: string): Promise<never> {
  const legacyUnitId = await resolveLegacyUnitId(param);
  if (!legacyUnitId) {
    const { notFound } = await import('next/navigation');
    notFound();
  }

  const byId = await getPublicUnitById(legacyUnitId!);
  const canonicalCode = getUnitCode(byId.data?.units?.[0]);
  if (!canonicalCode) {
    const { notFound } = await import('next/navigation');
    notFound();
  }
  redirect(buildPublicUnitDetailPath(canonicalCode));
}

/** Redirect legacy id URL to canonical /allProberties/{code} using authenticated fetch. */
export async function redirectLegacyIdToPublicCode(unitId: string): Promise<never> {
  const byId = await getUnitById(unitId);
  const canonicalCode = getUnitCode(byId.data?.units?.[0]);
  if (!canonicalCode) {
    const { notFound } = await import('next/navigation');
    notFound();
  }
  redirect(buildPublicUnitDetailPath(canonicalCode));
}

/** Redirect legacy admin slug to canonical /{clientId}/units/{code}/edit. */
export async function resolveAdminEditByCodeParam(
  rawParam: string,
  clientId?: string | null
): Promise<RawUnit | null> {
  const code = normalizeUnitCodeParam(rawParam);
  if (!code) return null;

  const byCode = await getUnitByCode(code);
  if (byCode.status && byCode.data.units.length) {
    const rawUnit = byCode.data.units[0];
    const canonicalCode = getUnitCode(rawUnit);
    if (canonicalCode && shouldRedirectToCanonical(rawParam, canonicalCode)) {
      redirect(buildAdminUnitEditPath(canonicalCode, clientId));
    }
    return rawUnit;
  }

  const legacyUnitId = await resolveLegacyUnitId(rawParam);
  if (!legacyUnitId) return null;

  const byId = await getUnitById(legacyUnitId);
  if (!byId.status || !byId.data.units.length) return null;

  const rawUnit = byId.data.units[0];
  const canonicalCode = getUnitCode(rawUnit);
  if (canonicalCode) {
    redirect(buildAdminUnitEditPath(canonicalCode, clientId));
  }
  return null;
}
