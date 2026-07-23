import Cookies from "js-cookie";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getClientCookieOptions } from "./CookieConfig";

// ACCESS_TOKEN and REFRESH_TOKEN are httpOnly — always set/read server-side
// (see actions.js, refresh-token/route.js). There is no client-side getter or
// setter for them; getAccessTokenExp() below is the only client-visible signal.

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

    static getAccessTokenExp() {
        const raw = Cookies.get(COOKIE_KEYS.ACCESS_TOKEN_EXP);
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? n : null;
    }

    static getClientInfo() {
        const info = Cookies.get(COOKIE_KEYS.CLIENT_INFO);
        try {
            return info ? JSON.parse(info) : null;
        } catch (error) {
            console.error("Failed to parse client info cookie:", error?.message ?? error);
            return null;
        }
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
        // ACCESS_TOKEN and REFRESH_TOKEN are httpOnly — cleared server-side by /api/auth/clear-session.
        // Remove the client-visible ones here.
        this.remove(COOKIE_KEYS.ACCESS_TOKEN_EXP);
        this.remove(COOKIE_KEYS.CLIENT_ID);
        this.remove(COOKIE_KEYS.CLIENT_INFO);
    }
}
