/**
 * Server-side King Admin Utility Functions
 * 
 * Provides utilities to check if the current user has king admin privileges.
 * King admin is defined as a user with client_id === 'public' AND valid authentication.
 * Uses JWT token validation for security (prevents header spoofing).
 * 
 * NOTE: For client-side components, import from './kingAdmin.client.js' instead
 */

import { getRoleFromToken } from "@/lib/getRoleFromToken";
import { cookies } from "next/headers";
import { COOKIE_KEYS } from "@/constants/cookieKeys";

/**
 * Checks if the given client_id has king admin privileges
 * @param {string} clientId - The client ID to check
 * @returns {boolean} - True if client_id === 'public', false otherwise
 */
export function isKingAdmin(clientId) {
  return clientId === 'public';
}

/**
 * Server-side function to check if current user is king admin
 * @returns {Promise<boolean>} - True if current user is king admin, false otherwise
 */
export async function isCurrentUserKingAdmin() {
  try {
    const cookieStore = await cookies();
    const clientId = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value;
    
    if (!clientId) {
      return false;
    }

    // Verify the user is authenticated with proper role
    const role = await getRoleFromToken();
    if (!role) {
      return false;
    }

    // Only allow admin/owner roles
    const allowedRoles = ['admin', 'owner'];
    if (!allowedRoles.includes(role.toLowerCase())) {
      return false;
    }

    return isKingAdmin(clientId);
  } catch (error) {
    console.error('Error checking king admin status:', error);
    return false;
  }
}

/**
 * Server-side function to check king admin status with proper JWT validation
 * @param {Request} request - The Next.js request object
 * @returns {Promise<boolean>} - True if the request is from authenticated king admin, false otherwise
 */
export async function isRequestFromKingAdmin(request) {
  try {
    // First verify the request has a valid JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
    
    if (!token) {
      return false;
    }

    // Get role from JWT to ensure the user is authenticated
    const role = await getRoleFromToken();
    if (!role) {
      return false;
    }

    // Only allow admin/owner roles to be considered for king admin
    const allowedRoles = ['admin', 'owner'];
    if (!allowedRoles.includes(role.toLowerCase())) {
      return false;
    }

    // Get client ID from multiple sources for validation
    const clientIdFromHeader = request.headers.get('x-client-id');
    const clientIdFromCookie = cookieStore.get(COOKIE_KEYS.CLIENT_ID)?.value;
    const clientId = clientIdFromHeader || clientIdFromCookie;

    // Verify the client ID is 'public' (king admin)
    return isKingAdmin(clientId);
  } catch (error) {
    console.error('Error validating king admin request:', error);
    return false;
  }
}

/**
 * Legacy function for backward compatibility - DEPRECATED
 * Use isRequestFromKingAdmin instead for new code
 * @param {Request} request - The Next.js request object
 * @returns {boolean} - True if the request appears to be from king admin (less secure)
 */
export function isRequestFromKingAdminLegacy(request) {
  const clientId = request.headers.get('x-client-id') || 
                   request.cookies.get(COOKIE_KEYS.CLIENT_ID)?.value;
  return isKingAdmin(clientId);
}
