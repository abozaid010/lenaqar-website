import axiosInstance from '@/utils/axiosInstance';
import { normalizeUnitCodeParam } from '@/lib/units/unit-share-links';
import { mapSlimUnitsListResponse } from '@/lib/units/slim-unit-list-mapper';
import {
  buildPendingApprovalSlimListParams,
  buildPendingApprovalSlimListUrl,
} from '@/lib/units/pending-approval-list-params';
import { getRestrictedDashboardAuthorEmailFromToken } from '@/lib/getRoleFromToken';
import { safeMergeParams } from '@/utils/safeJsonParser';
import type { UnitApiResponse } from './unit-types';

const NOT_FOUND_RESPONSE: UnitApiResponse = {
  status: false,
  code: 404,
  message: 'Not Found',
  data: { units: [] },
};

function wrapSingleUnitResponse(unitData: unknown): UnitApiResponse {
  if (unitData) {
    return {
      status: true,
      code: 200,
      message: 'Success',
      data: { units: [unitData as UnitApiResponse['data']['units'][0]] },
    };
  }
  return NOT_FOUND_RESPONSE;
}

function handleUnitFetchError(error: unknown): UnitApiResponse | never {
  const statusCode = (error as { response?: { status?: number } })?.response?.status;
  if (statusCode === 404 || statusCode === 409) {
    return NOT_FOUND_RESPONSE;
  }
  if ((error as { message?: string })?.message === 'No unit data found') {
    return NOT_FOUND_RESPONSE;
  }
  throw error;
}

export async function getUnitById(unitId: string): Promise<UnitApiResponse> {
  try {
    const response = await axiosInstance.get(`/units/details/${unitId}`);
    return wrapSingleUnitResponse(response.data?.data);
  } catch (error) {
    return handleUnitFetchError(error);
  }
}

export async function getUnitByCode(code: string): Promise<UnitApiResponse> {
  const normalized = normalizeUnitCodeParam(code);
  if (!normalized) return NOT_FOUND_RESPONSE;

  try {
    const response = await axiosInstance.get(
      `/units/by-code/${encodeURIComponent(normalized)}`
    );
    return wrapSingleUnitResponse(response.data?.data);
  } catch (error) {
    return handleUnitFetchError(error);
  }
}

export async function getPublicUnitById(unitId: string): Promise<UnitApiResponse> {
  try {
    const response = await axiosInstance.get(`/public/unit-details/${unitId}`);
    return wrapSingleUnitResponse(response.data?.data);
  } catch (error) {
    return handleUnitFetchError(error);
  }
}

export async function getPublicUnitByCode(code: string): Promise<UnitApiResponse> {
  const normalized = normalizeUnitCodeParam(code);
  if (!normalized) return NOT_FOUND_RESPONSE;

  try {
    const response = await axiosInstance.get(
      `/public/unit-by-code/${encodeURIComponent(normalized)}`
    );
    return wrapSingleUnitResponse(response.data?.data);
  } catch (error) {
    return handleUnitFetchError(error);
  }
}

export async function getUnits(): Promise<UnitApiResponse> {
  try {
    const response = await axiosInstance.get('/units/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching units:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Server-side equivalent of `fetchUnitsFilter` from `src/utils/api.js`.
 * Called from `units/page.jsx` (RSC) so the first page of the units list is
 * rendered server-side — the browser Network tab never sees `/units/v1/slim-list`
 * on initial load. Subsequent filter/page changes still go through the client hook.
 *
 * @param searchParams - Raw Next.js searchParams from the page (object, not string)
 * @param clientId - From cookie; used to scope My-Inventory filter server-side
 */
export async function fetchUnitsFilterServer(
  searchParams: Record<string, string | string[] | undefined>,
  clientId: string
): Promise<Record<string, unknown> | null> {
  try {
    const base: Record<string, unknown> = { ...(searchParams ?? {}) };

    // Mirror the client-side logic in units-page-query-optimized.jsx
    delete base.client_id;
    delete base.clientId;
    delete base.visibility;

    const params: Record<string, unknown> = {
      ...base,
      page_size: Number(base.page_size) || 16,
      visibility: 'visible',
    };

    if (base.resale === 'true') {
      params.is_primary = false;
    }

    if (base.my_inventory === 'true' && clientId) {
      params.client_id = clientId;
    }

    // Same author ACL as Leads: non-admin/non-owner always scoped to own email.
    const restrictedAuthor = await getRestrictedDashboardAuthorEmailFromToken();
    if (restrictedAuthor) {
      params.author = restrictedAuthor;
    }

    // Drop empty/undefined values
    Object.keys(params).forEach((k) => {
      const v = params[k];
      if (v === undefined || v === null || v === '') delete params[k];
    });

    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();

    const url = `/units/v1/slim-list${qs ? `?${qs}` : ''}`;
    const response = await axiosInstance.get(url);

    if (!response.data?.data?.units || !Array.isArray(response.data.data.units)) {
      return null;
    }

    return mapSlimUnitsListResponse(response.data) as Record<string, unknown>;
  } catch {
    // On server-fetch failure, return null — the client hook will retry transparently.
    return null;
  }
}

/**
 * Server-side equivalent of `fetchPendingApprovalUnits` from `src/utils/api.js`.
 * Prefetches the Hidden Units list in RSC so the browser never calls
 * `/units/v1/slim-list` on initial load. Filter changes still fetch from the client hook.
 */
export async function fetchPendingApprovalUnitsServer(
  searchParams: Record<string, string | string[] | undefined>,
  clientId: string
): Promise<Record<string, unknown> | null> {
  try {
    const base: Record<string, unknown> = { ...(searchParams ?? {}) };
    const params = buildPendingApprovalSlimListParams(base, clientId);
    const restrictedAuthor = await getRestrictedDashboardAuthorEmailFromToken();
    if (restrictedAuthor) {
      params.author = restrictedAuthor;
    }
    const url = buildPendingApprovalSlimListUrl(params);
    const response = await axiosInstance.get(url);

    if (!response.data?.data?.units || !Array.isArray(response.data.data.units)) {
      return null;
    }

    return mapSlimUnitsListResponse(response.data) as Record<string, unknown>;
  } catch {
    return null;
  }
}
