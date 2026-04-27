import axiosInstance from '@/utils/axiosInstance';
import type { UnitApiResponse } from './unit-types';

export async function getUnitById(unitId: string): Promise<UnitApiResponse> {
  try {
    const response = await axiosInstance.get(`/units/details/${unitId}`);
    // Transform the response to match the expected UnitApiResponse structure
    const unitData = response.data?.data;
    if (unitData) {
      return {
        status: true,
        code: 200,
        message: 'Success',
        data: {
          units: [unitData]
        }
      };
    }
  } catch (error) {
    const statusCode = (error as any)?.response?.status;
    // Treat "not found" as a non-exceptional result so pages can render NotFound UI
    if (statusCode === 404) {
      return {
        status: false,
        code: 404,
        message: 'Not Found',
        data: { units: [] },
      };
    }
    // If the API returned a 2xx but missing payload, also return empty result
    if ((error as any)?.message === 'No unit data found') {
      return {
        status: false,
        code: 404,
        message: 'Not Found',
        data: { units: [] },
      };
    }
    throw error;
  }

  // Fallback: response had no data payload
  return {
    status: false,
    code: 404,
    message: 'Not Found',
    data: { units: [] },
  };
}

export async function getPublicUnitById(unitId: string): Promise<UnitApiResponse> {
  try {
    const response = await axiosInstance.get(`/public/unit-details/${unitId}`);
    // Transform the response to match the expected UnitApiResponse structure
    const unitData = response.data?.data;
    if (unitData) {
      return {
        status: true,
        code: 200,
        message: 'Success',
        data: {
          units: [unitData]
        }
      };
    }
  } catch (error) {
    const statusCode = (error as any)?.response?.status;
    if (statusCode === 404) {
      return {
        status: false,
        code: 404,
        message: 'Not Found',
        data: { units: [] },
      };
    }
    if ((error as any)?.message === 'No unit data found') {
      return {
        status: false,
        code: 404,
        message: 'Not Found',
        data: { units: [] },
      };
    }
    throw error;
  }

  return {
    status: false,
    code: 404,
    message: 'Not Found',
    data: { units: [] },
  };
}

export async function getUnits(): Promise<UnitApiResponse> {
  try {
    const response = await axiosInstance.get('/units/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching units:', error);
    throw error;
  }
}
