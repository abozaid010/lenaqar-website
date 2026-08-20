import Cookies from "js-cookie";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getClientCookieOptions } from "./CookieConfig";

/** Public site: language preference only. */
export class LenaCookiesManager {
  static get(key) {
    return Cookies.get(key);
  }

  static set(key, value, options) {
    Cookies.set(key, value, options ?? getClientCookieOptions("LANG"));
  }

  static remove(key) {
    Cookies.remove(key);
  }
}
