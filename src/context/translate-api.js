"use client";

import { createContext, useContext, useMemo, useCallback, useState, useEffect } from "react";
import ar from "../../public/locales/public-ar.js";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { SITE } from "@/config/site";
import {
  loadLocaleMessages,
  primeLocaleMessagesCache,
} from "@/lib/i18n/load-locale-messages";

primeLocaleMessagesCache("ar", ar);

const I18nContext = createContext({
  locale: "ar",
  t: ar,
  changeLanguage: async () => {},
  isLocaleLoading: false,
});

export const I18nProvider = ({ initialLocal = "ar", children }) => {
  const [locale, setLocale] = useState("ar");
  const [t, setT] = useState(ar);
  const [isLocaleLoading, setIsLocaleLoading] = useState(initialLocal === "en");

  useEffect(() => {
    let cancelled = false;

    const syncFromCookieOrInitial = async () => {
      const cookieLang = LenaCookiesManager.get(COOKIE_KEYS.LANG);
      const target =
        cookieLang === "en" || cookieLang === "ar"
          ? cookieLang
          : initialLocal === "en" || initialLocal === "ar"
            ? initialLocal
            : "ar";

      if (target === "ar") {
        if (!cancelled) {
          setT(ar);
          setLocale("ar");
          setIsLocaleLoading(false);
        }
        return;
      }

      setIsLocaleLoading(true);
      try {
        const messages = await loadLocaleMessages("en");
        if (!cancelled) {
          setT(messages);
          setLocale("en");
        }
      } finally {
        if (!cancelled) setIsLocaleLoading(false);
      }
    };

    syncFromCookieOrInitial();
    return () => {
      cancelled = true;
    };
  }, [initialLocal]);

  const changeLanguage = useCallback(async (lang) => {
    if (lang !== "en" && lang !== "ar") return;
    setIsLocaleLoading(true);
    try {
      if (lang === "ar") {
        setT(ar);
      } else {
        const messages = await loadLocaleMessages("en");
        setT(messages);
      }
      setLocale(lang);
      LenaCookiesManager.set(COOKIE_KEYS.LANG, lang, { expires: 365 });
      if (typeof document !== "undefined") {
        document.documentElement.lang = lang === "ar" ? SITE.htmlLang : lang;
        document.documentElement.dir = lang === "ar" ? SITE.dir : "ltr";
      }
    } finally {
      setIsLocaleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale === "ar" ? SITE.htmlLang : locale;
    document.documentElement.dir = locale === "ar" ? SITE.dir : "ltr";
  }, [locale]);

  const value = useMemo(
    () => ({ locale, t, changeLanguage, isLocaleLoading }),
    [locale, t, changeLanguage, isLocaleLoading],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
