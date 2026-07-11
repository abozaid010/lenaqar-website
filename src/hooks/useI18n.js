"use client";

import { useI18n as useTranslation } from "@/context/translate-api";
import { useCallback, useMemo } from "react";
import { getMappedTranslation, formatDate, formatNumber, formatCurrency } from "@/lib/i18n-mappings";
import { safePropertyAccess, sanitizeTranslationValue, validateTranslationKey } from "@/utils/translation-sanitizer";

const warnedDirectTAccess = new Set();

function createStrictTProxy(node, path = []) {
  if (!node || typeof node !== "object") return node;

  return new Proxy(node, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof prop !== "string") return value;

      const nextPath = [...path, prop];
      const pathLabel = nextPath.join(".");

      if (
        process.env.NODE_ENV === "development" &&
        pathLabel &&
        !warnedDirectTAccess.has(pathLabel)
      ) {
        warnedDirectTAccess.add(pathLabel);
        console.warn(
          `[i18n] Direct t access detected: t.${pathLabel}. Prefer translate("${pathLabel}", t.${pathLabel}).`
        );
      }

      if (value && typeof value === "object") {
        return createStrictTProxy(value, nextPath);
      }
      return value;
    },
  });
}

export function useI18n() {
  const { t: rawT, locale, changeLanguage } = useTranslation();
  const t = useMemo(() => createStrictTProxy(rawT || {}), [rawT]);

  // Enhanced translation function with security and fallback
  const translate = useCallback((key, fallback = null) => {
    if (!key) return fallback || "";
    
    // Validate and sanitize the translation key
    const validation = validateTranslationKey(key, fallback);
    
    if (!validation.isValid) {
      // Log security issue in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Unsafe translation key rejected: ${key}`);
      }
      return validation.fallback;
    }
    
    try {
      // Use safe property access to prevent prototype pollution
      const value = safePropertyAccess(rawT, validation.safeKey);
      
      if (value !== undefined && value !== null && value !== "") {
        // Sanitize the translation value to prevent XSS
        return sanitizeTranslationValue(value);
      }
      
      // Missing translation key handling:
      // - If caller provided a fallback, return it (legacy support).
      // - If no fallback and we're in development, fail fast (strict-by-default).
      if (fallback !== null && fallback !== undefined) return fallback;
      if (process.env.NODE_ENV === "development") {
        const topKeys =
          rawT && typeof rawT === "object" ? Object.keys(rawT).slice(0, 25) : [];
        throw new Error(
          `Missing translation: ${validation.safeKey} (locale: ${locale}). Top-level keys: ${topKeys.join(
            ", "
          )}`
        );
      }
      return validation.safeKey;
    } catch (error) {
      console.error(`Translation error for key: ${validation.safeKey}`, error?.message ?? error);
      return fallback || validation.safeKey;
    }
  }, [rawT, locale]);

  // Assert translations are present in development (no silent key display)
  const translateStrict = useCallback((key) => {
    // translate() is strict-by-default in development when fallback is null.
    return translate(key, null);
  }, [translate]);

  // Helper for mapped translations (enums/backend values)
  const getMapped = useCallback((value, mapping, fallback = null) => {
    return getMappedTranslation(value, mapping, translate) || fallback || value;
  }, [translate]);

  // Memoized locale-aware formatting functions
  const localeUtils = useMemo(() => ({
    formatDate: (date) => formatDate(date, locale),
    formatNumber: (number) => formatNumber(number, locale),
    formatCurrency: (amount, currency = 'EGP') => formatCurrency(amount, currency, locale),
    isRTL: locale === 'ar',
    direction: locale === 'ar' ? 'rtl' : 'ltr',
    textAlign: locale === 'ar' ? 'right' : 'left',
  }), [locale]);

  // Common translation helpers
  const common = useMemo(() => ({
    // Actions
    save: translate('common.save'),
    cancel: translate('common.cancel'),
    delete: translate('common.delete'),
    edit: translate('common.edit'),
    add: translate('common.add'),
    retry: translate('common.retry'),
    loading: translate('common.loading'),
    
    // Status
    success: translate('common.success'),
    error: translate('common.error'),
    warning: translate('common.warning'),
    info: translate('common.info'),
    
    // Navigation
    back: translate('common.back'),
    next: translate('common.next'),
    previous: translate('common.previous'),
    
    // Form
    required: translate('common.required'),
    optional: translate('common.optional'),
    submit: translate('common.submit'),
    
    // Dashboard specific
    selectLead: translate('dashboard.selectLead'),
    leads: translate('dashboard.leads'),
    requirement: translate('dashboard.requirement'),
    contact: translate('dashboard.contact'),
    actions: translate('dashboard.actions'),
    loadingConversation: translate('common.loadingConversation'),
    couldNotLoadChat: translate('common.couldNotLoadChat'),
    failedToLoadLeads: translate('common.failedToLoadLeads'),
    loadingMore: translate('common.loadingMore'),
    loadMore: translate('common.loadMore'),
    deleteUser: translate('common.deleteUser'),
    deleteCannotBeUndone: translate('common.deleteCannotBeUndone'),
    openWhatsApp: translate('common.openWhatsApp'),
    whatsapp: translate('common.whatsapp'),
    operationFailed: translate('common.operationFailed'),
  }), [translate]);

  // Property-related helpers
  const property = useMemo(() => ({
    // Building types
    getBuildingType: (type) => getMapped(type, {
      apartment: 'property.buildingTypes.apartment',
      villa: 'property.buildingTypes.villa',
      duplex: 'property.buildingTypes.duplex',
      penthouse: 'property.buildingTypes.penthouse',
      townhouse: 'property.buildingTypes.townhouse',
      studio: 'property.buildingTypes.studio',
      chalet: 'property.buildingTypes.chalet',
      twinhouse: 'property.buildingTypes.twinhouse',
      standalone: 'property.buildingTypes.standalone',
      bungalow: 'property.buildingTypes.bungalow',
      commercial: 'property.buildingTypes.commercial',
      office: 'property.buildingTypes.office',
      retail: 'property.buildingTypes.retail',
      administrative: 'property.buildingTypes.administrative',
      land: 'property.buildingTypes.land',
    }),
    
    // Purpose
    getPurpose: (purpose) => getMapped(purpose, {
      sell: 'property.purpose.sell',
      rent: 'property.purpose.rent',
      buy: 'property.purpose.buy',
      lease: 'property.purpose.lease',
    }),
    
    // Finishing types
    getFinishing: (finishing) => getMapped(finishing?.toLowerCase(), {
      finished: 'property.finishing.finished',
      'semi-finished': 'property.finishing.semiFinished',
      'semi finished': 'property.finishing.semiFinished',
      'core & shell': 'property.finishing.coreShell',
      'core and shell': 'property.finishing.coreShell',
      unfinished: 'property.finishing.unfinished',
      'white box': 'property.finishing.whiteBox',
      flixy: 'property.finishing.flixy',
    }),
    
    // Furnishing types
    getFurnishing: (furnishing) => getMapped(furnishing?.toLowerCase(), {
      furnished: 'property.furnishing.furnished',
      unfurnished: 'property.furnishing.unfurnished',
      'partially furnished': 'property.furnishing.partiallyFurnished',
      'semi furnished': 'property.furnishing.semiFurnished',
      hotel_furnished: 'property.furnishing.hotelFurnished',
      flixy: 'property.furnishing.flixy',
      turnkey: 'property.furnishing.turnkey',
    }),
    
    // View types
    getView: (view) => getMapped(view?.toLowerCase(), {
      garden: 'property.view.garden',
      pool: 'property.view.pool',
      sea: 'property.view.sea',
      landmark: 'property.view.landmark',
      street: 'property.view.street',
      other: 'property.view.other',
      mountain: 'property.view.mountain',
      city: 'property.view.city',
      park: 'property.view.park',
      lake: 'property.view.lake',
      golf: 'property.view.golf',
      partial: 'property.view.partial',
      open: 'property.view.open',
      desert: 'property.view.desert',
      river: 'property.view.river',
      courtyard: 'property.view.courtyard',
      forest: 'property.view.forest',
      beach: 'property.view.beach',
      lagoon: 'property.view.lagoon',
      openArea: 'property.view.openArea',
    }),
    
    // Action types for dashboard
    getActionType: (action) => {
      const actionMap = {
        Monitorlead: 'dashboard.actionTypes.monitorLead',
        makeCall: 'dashboard.actionTypes.makeCall',
        officeVisit: 'dashboard.actionTypes.officeVisit',
        propertyView: 'dashboard.actionTypes.propertyView',
        Interested: 'dashboard.actionTypes.interested',
        notInterested: 'dashboard.actionTypes.notInterested',
        notQualified: 'dashboard.actionTypes.notQualified',
        followUpLater: 'dashboard.actionTypes.followUpLater',
        missingRequirement: 'dashboard.actionTypes.missingRequirement',
        blocked: 'dashboard.actionTypes.blocked',
        print: 'dashboard.actionTypes.print',
        exportExcel: 'dashboard.actionTypes.exportExcel',
        onGoingConversion: 'dashboard.actionTypes.onGoingConversion',
        qualifiedLead: 'dashboard.actionTypes.qualifiedLead',
        noAction: 'dashboard.actionTypes.noAction',
      };
      return getMapped(action, actionMap);
    },
    
    // Unit details
    getUnitTitle: () => translate('unitDetails.title'),
    getDeveloper: () => translate('unitDetails.developer'),
    getDeliveryDate: () => translate('unitDetails.deliveryDate'),
    getFloor: () => translate('unitDetails.floor'),
    getFinishing: () => translate('unitDetails.finishing'),
    getFurnishing: () => translate('unitDetails.furnishing'),
    getArea: () => translate('unitDetails.area'),
    getView: () => translate('unitDetails.view'),
    getRooms: () => translate('unitDetails.rooms'),
    getBathrooms: () => translate('unitDetails.bathrooms'),
    getNotAvailable: () => translate('unitDetails.notAvailable'),
    getGround: () => translate('unitDetails.ground'),
    getFirst: () => translate('unitDetails.first'),
    getSecond: () => translate('unitDetails.second'),
    getThird: () => translate('unitDetails.third'),
    getTh: () => translate('unitDetails.th'),
    
    // Steps
    getOwnerDetails: () => translate('steps.ownerDetails'),
    
    // Basic details
    getCode: () => translate('basicDetails.code'),
    getModel: () => translate('basicDetails.model'),
  }), [translate, getMapped]);

  return {
    t,              // raw locale object  →  t?.unitPricing?.totalPrice
    translate,      // function wrapper   →  translate('unitPricing.totalPrice')
    translateStrict,
    locale,
    changeLanguage,
    isRTL: locale === 'ar',
    direction: locale === 'ar' ? 'rtl' : 'ltr',
    common,
    property,
    localeUtils,
    getMapped,
  };
}
