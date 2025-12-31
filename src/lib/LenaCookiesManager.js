import Cookies from "js-cookie";
import { COOKIE_KEYS } from "@/constants/cookieKeys";

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
}
