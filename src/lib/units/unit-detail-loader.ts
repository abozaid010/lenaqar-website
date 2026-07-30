import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_KEYS } from '@/constants/cookieKeys';
import { transformUnitToViewModel } from '@/lib/units/unit-selectors';
import { isOwnClientUnit } from '@/lib/units/unit-ownership';
import {
  resolveAdminUnitByCodeParam,
  resolvePublicUnitByCodeParam,
} from '@/lib/units/unit-legacy-redirect';
import {
  buildAdminUnitDetailPath,
  normalizeUnitCodeParam,
} from '@/lib/units/unit-share-links';
import {
  getListingClientId,
  isPrivacyRestrictedViewMode,
  resolveUnitViewMode,
  toPublicUnitViewModel,
  type UnitViewMode,
} from '@/lib/units/unit-view-mode';
import type { RawUnit, UnitViewModel } from '@/lib/units/unit-types';

export type CanonicalUnitDetailResult = {
  viewMode: UnitViewMode;
  unit: UnitViewModel;
  rawUnit: RawUnit | undefined;
  isOwnUnit: boolean;
  listingClientId: string | null;
  normalizedCode: string;
  detailPath: string;
};

function hasActiveSession(cookieStore: Awaited<ReturnType<typeof cookies>>): boolean {
  return Boolean(cookieStore.get(COOKIE_KEYS.REFRESH_TOKEN)?.value);
}

/**
 * Load unit detail for the canonical `/{listingClientId}/units/{code}` route.
 * - same_client → authenticated API + full VM
 * - privacy_mode / external_client → public API + stripped VM (never hydrate owner_mobile)
 *
 * Redirects to the permanent listing-client URL when the browser path's clientId mismatches.
 */
export async function loadCanonicalUnitDetail(opts: {
  rawCode: string;
  /** Original browser pathname (from proxy `x-lena-pathname`), if available. */
  browserPathname?: string | null;
  t?: unknown;
  locale?: string;
}): Promise<CanonicalUnitDetailResult | null> {
  const code = normalizeUnitCodeParam(opts.rawCode);
  if (!code) return null;

  const cookieStore = await cookies();
  const sessionClientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value || null;
  const hasSession = hasActiveSession(cookieStore);

  let viewMode: UnitViewMode;
  let rawUnit: RawUnit | undefined;
  let unit: UnitViewModel;

  if (hasSession && sessionClientId) {
    let authUnit: RawUnit | null = null;
    try {
      authUnit = await resolveAdminUnitByCodeParam(opts.rawCode, sessionClientId);
    } catch (error) {
      if ((error as { digest?: string })?.digest?.startsWith?.('NEXT_REDIRECT')) throw error;
      authUnit = null;
    }

    if (authUnit && isOwnClientUnit(authUnit, sessionClientId)) {
      viewMode = 'same_client_with_permission';
      rawUnit = authUnit;
      unit = transformUnitToViewModel(authUnit, opts.t as never, opts.locale);
    } else {
      // External client (or auth miss): public API only — never hydrate private fields.
      const publicUnit = await resolvePublicUnitByCodeParam(opts.rawCode);
      if (!publicUnit) return null;
      viewMode = resolveUnitViewMode({
        hasSession: true,
        sessionClientId,
        unit: publicUnit,
      });
      // Defensive: if public payload somehow matches session client, treat as same_client
      // only when we also had auth confirmation — otherwise stay privacy-restricted.
      if (viewMode === 'same_client_with_permission') {
        viewMode = 'external_client';
      }
      unit = toPublicUnitViewModel(publicUnit, opts.t, opts.locale);
      rawUnit = undefined;
    }
  } else {
    const publicUnit = await resolvePublicUnitByCodeParam(opts.rawCode);
    if (!publicUnit) return null;
    viewMode = 'privacy_mode';
    unit = toPublicUnitViewModel(publicUnit, opts.t, opts.locale);
    rawUnit = undefined;
  }

  const listingClientId =
    getListingClientId(rawUnit) ||
    (unit.clientId != null && String(unit.clientId).trim()
      ? String(unit.clientId).trim()
      : null);
  const normalizedCode =
    normalizeUnitCodeParam(rawUnit?.code ?? unit.referenceCode) || code;
  const detailPath = buildAdminUnitDetailPath(normalizedCode, listingClientId);

  // Permanent URL: redirect when browser path clientId ≠ listing clientId.
  maybeRedirectToListingClientUrl({
    browserPathname: opts.browserPathname,
    listingClientId,
    normalizedCode,
    detailPath,
  });

  return {
    viewMode,
    unit,
    rawUnit: isPrivacyRestrictedViewMode(viewMode) ? undefined : rawUnit,
    isOwnUnit: viewMode === 'same_client_with_permission',
    listingClientId,
    normalizedCode,
    detailPath,
  };
}

function maybeRedirectToListingClientUrl(opts: {
  browserPathname?: string | null;
  listingClientId: string | null;
  normalizedCode: string;
  detailPath: string;
}): void {
  if (!opts.browserPathname || !opts.listingClientId) return;

  const segments = opts.browserPathname.split('/').filter(Boolean);
  // /{clientId}/units/{code}
  if (segments.length === 3 && segments[1] === 'units') {
    const urlClientId = segments[0];
    if (urlClientId !== opts.listingClientId) {
      redirect(opts.detailPath);
    }
    return;
  }
  // bare /units/{code} → promote to /{listingClientId}/units/{code}
  if (segments.length === 2 && segments[0] === 'units') {
    redirect(opts.detailPath);
  }
}
