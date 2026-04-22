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
    throw new Error('No unit data found');
  } catch (error) {
    console.error('Error fetching unit by ID:', error);
    throw error;
  }
}

export async function getUnits(): Promise<UnitApiResponse> {
  try {
    const response = await axiosInstance.get('/units');
    return response.data;
  } catch (error) {
    console.error('Error fetching units:', error);
    throw error;
  }
}
