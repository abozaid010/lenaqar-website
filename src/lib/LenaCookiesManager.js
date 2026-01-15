import Cookies from "js-cookie";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getClientCookieOptions } from "./CookieConfig";

export class LenaCookiesManager {
    static get(key) {
        return Cookies.get(key);
    }

    static set(key, value, options) {
        Cookies.set(key, value, options);
    }

    static remove(key) {
        Cookies.remove(key);
    }

    static getClientId() {
        return Cookies.get(COOKIE_KEYS.CLIENT_ID);
    }

    static getAccessToken() {
        return Cookies.get(COOKIE_KEYS.ACCESS_TOKEN);
    }

    static getRefreshToken() {
        return Cookies.get(COOKIE_KEYS.REFRESH_TOKEN);
    }

    static getClientInfo() {
        const info = Cookies.get(COOKIE_KEYS.CLIENT_INFO);
        try {
            return info ? JSON.parse(info) : null;
        } catch (error) {
            console.error("Failed to parse client info cookie:", error);
            return null;
        }
    }

    /**
     * Sets the access token with proper cookie configuration
     * @param {string} token - The access token
     * @param {Object} customOptions - Optional custom cookie options to override defaults
     */
    static setAccessToken(token, customOptions = {}) {
        const options = {
            ...getClientCookieOptions("ACCESS_TOKEN"),
            ...customOptions,
        };
        this.set(COOKIE_KEYS.ACCESS_TOKEN, token, options);
    }

    /**
     * Sets the refresh token with proper cookie configuration
     * @param {string} token - The refresh token
     * @param {Object} customOptions - Optional custom cookie options to override defaults
     */
    static setRefreshToken(token, customOptions = {}) {
        const options = {
            ...getClientCookieOptions("REFRESH_TOKEN"),
            ...customOptions,
        };
        this.set(COOKIE_KEYS.REFRESH_TOKEN, token, options);
    }

    /**
     * Sets the client ID with proper cookie configuration
     * @param {string} clientId - The client ID
     * @param {Object} customOptions - Optional custom cookie options to override defaults
     */
    static setClientId(clientId, customOptions = {}) {
        const options = {
            ...getClientCookieOptions("CLIENT_ID"),
            ...customOptions,
        };
        this.set(COOKIE_KEYS.CLIENT_ID, clientId, options);
    }

    /**
     * Sets the client info with proper cookie configuration
     * @param {Object} clientInfo - The client info object
     * @param {Object} customOptions - Optional custom cookie options to override defaults
     */
    static setClientInfo(clientInfo, customOptions = {}) {
        const options = {
            ...getClientCookieOptions("CLIENT_INFO"),
            ...customOptions,
        };
        this.set(COOKIE_KEYS.CLIENT_INFO, JSON.stringify(clientInfo), options);
    }

    /**
     * Clears all authentication-related cookies
     */
    static clearAuthCookies() {
        this.remove(COOKIE_KEYS.ACCESS_TOKEN);
        this.remove(COOKIE_KEYS.REFRESH_TOKEN);
        this.remove(COOKIE_KEYS.CLIENT_ID);
        this.remove(COOKIE_KEYS.CLIENT_INFO);
    }
}
