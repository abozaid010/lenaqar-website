import { transformUnitToViewModel } from '@/lib/units/unit-selectors';
import { getItemClientId, isOwnClientUnit } from '@/lib/units/unit-ownership';
import type { RawUnit, UnitViewModel } from '@/lib/units/unit-types';

/** Viewing modes for the canonical unit detail URL. */
export type UnitViewMode =
  | 'privacy_mode'
  | 'same_client_with_permission'
  | 'external_client';

/**
 * Decide how the unit detail page should render after auth + ownership checks.
 * Capabilities come only from session + client relationship — not from which path was used.
 */
export function resolveUnitViewMode(opts: {
  hasSession: boolean;
  sessionClientId?: string | null;
  unit: { clientId?: string | null; client_id?: string | null } | null | undefined;
}): UnitViewMode {
  if (!opts.hasSession) return 'privacy_mode';
  if (isOwnClientUnit(opts.unit, opts.sessionClientId)) {
    return 'same_client_with_permission';
  }
  return 'external_client';
}

/** Privacy-restricted modes: no owner private fields, no edit/delete/chat. */
export function isPrivacyRestrictedViewMode(mode: UnitViewMode): boolean {
  return mode === 'privacy_mode' || mode === 'external_client';
}

/**
 * Strip CRM-only fields so they never hydrate into privacy / external payloads.
 * Used for privacy_mode and external_client.
 */
export function toPublicUnitViewModel(
  rawUnit: RawUnit,
  t?: unknown,
  locale?: string
): UnitViewModel {
  const unit = transformUnitToViewModel(rawUnit, t as never, locale);
  return {
    ...unit,
    ownerName: null,
    ownerMobile: null,
    ownerWhatsapp: null,
    author: null,
    phase: null,
    notes: null,
    trustItems: (unit.trustItems || []).filter((item) => item.key !== 'employee'),
  };
}

/** Listing client's id from a raw unit (for canonical share URLs). */
export function getListingClientId(
  unit: { clientId?: string | null; client_id?: string | null } | null | undefined
): string | null {
  return getItemClientId(unit);
}
