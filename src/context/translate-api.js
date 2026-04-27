'use client';

import { createContext, useContext, useMemo, useCallback, useState, useEffect } from "react";

import en from "../../public/locales/en.js";
import ar from "../../public/locales/ar.js";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { COOKIE_KEYS } from "@/constants/cookieKeys";

const context = {
    locale: "ar",
    t: ar,
    changeLanguage: () => { },
};

const I18nContext = createContext(context);

export const I18nProvider = ({ initialLocal = "ar", children }) => {
    const [locale, setLocale] = useState(initialLocal);

    /**
     * INFO: Hydration error:
     *   The hydration error occurs because `I18nProvider` is a client-side component, 
     *   but it's being used in a server-rendered context (the root layout) WITHOUT proper synchronization between server and client states.
    */

    // Sync with cookie on mount (client-side only)
    useEffect(() => {
        const cookieLang = LenaCookiesManager.get('lang'); // 'lang' is not in standard keys yet... but it's a cookie key. 
        // I should probably add it to COOKIE_KEYS but user didn't ask for it explicitly. 
        // But for consistency I should.
        // Let's use string 'lang' for now via LenaCookiesManager or add it.
        // It's better to add it to COOKIE_KEYS.

        if (cookieLang && cookieLang !== locale) {
            setLocale(cookieLang);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const changeLanguage = useCallback((lang) => {
        setLocale(lang);
        LenaCookiesManager.set("lang", lang, { expires: 365 }); // Store in cookie (expires in 1 year)
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }, []);

    const t = useMemo(() => locale === "ar" ? ar : en, [locale]);

    return (
        <I18nContext.Provider value={{ locale, t, changeLanguage }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => useContext(I18nContext);