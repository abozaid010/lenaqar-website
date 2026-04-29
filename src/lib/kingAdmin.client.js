/**
 * Client-side King Admin Utility Functions
 *
 * Provides utilities to check if the current user has king admin privileges
 * for client-side components. These functions are safe to use in client components.
 *
 * King admin is defined as a user with client_id === 'public'
 * NOTE: Gets client_id from the JWT access token (secure) not from cookies
 */

import { getClientIdFromToken } from "@/lib/getRoleFromToken.client";

/**
 * Checks if the given client_id has king admin privileges
 * @param {string} clientId - The client ID to check
 * @returns {boolean} - True if client_id === 'public', false otherwise
 */
export function isKingAdmin(clientId) {
  return clientId === 'public';
}

/**
 * Gets the current client ID from the JWT access token and checks if it's a king admin
 * @returns {boolean} - True if current user is king admin, false otherwise
 */
export function isCurrentUserKingAdmin() {
  const clientId = getClientIdFromToken();
  return isKingAdmin(clientId);
}

/**
 * Client-side function to check if current user appears to be king admin
 * NOTE: This is for UI purposes only and should not be used for security decisions
 * Always validate on the server side for sensitive operations
 * @returns {boolean} - True if current user appears to be king admin
 */
export function isClientSideKingAdmin() {
  const clientId = getClientIdFromToken();
  return isKingAdmin(clientId);
}
