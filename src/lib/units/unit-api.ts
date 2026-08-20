import axiosInstance from '@/utils/axiosInstance';
import { normalizeUnitCodeParam } from '@/lib/units/unit-share-links';
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

/** Authenticated detail — used only as fallback for legacy id redirects. */
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

/** Legacy slug cache — best-effort; public site may not have auth for /units/all. */
export async function getUnits(): Promise<UnitApiResponse> {
  try {
    const response = await axiosInstance.get('/units/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching units:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}
