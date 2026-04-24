/**
 * King Admin Utility Functions
 * 
 * Provides utilities to check if the current user has king admin privileges.
 * King admin is defined as a user with client_id === 'public'
 */

import { LenaCookiesManager } from "@/lib/LenaCookiesManager";

/**
 * Checks if the given client_id has king admin privileges
 * @param {string} clientId - The client ID to check
 * @returns {boolean} - True if client_id === 'public', false otherwise
 */
export function isKingAdmin(clientId) {
  return clientId === 'public';
}

/**
 * Gets the current client ID from cookies and checks if it's a king admin
 * @returns {boolean} - True if current user is king admin, false otherwise
 */
export function isCurrentUserKingAdmin() {
  const clientId = LenaCookiesManager.getClientId();
  return isKingAdmin(clientId);
}

/**
 * Server-side function to check king admin status from request headers
 * @param {Request} request - The Next.js request object
 * @returns {boolean} - True if the request is from king admin, false otherwise
 */
export function isRequestFromKingAdmin(request) {
  const clientId = request.headers.get('x-client-id') || 
                   request.cookies.get('client_id')?.value;
  return isKingAdmin(clientId);
}
