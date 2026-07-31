// Centralized mapping layers for enums and backend values
export const propertyMappings = {
  // Building types mapping
  buildingTypes: {
    apartment: "property.buildingTypes.apartment",
    villa: "property.buildingTypes.villa",
    duplex: "property.buildingTypes.duplex",
    penthouse: "property.buildingTypes.penthouse",
    townhouse: "property.buildingTypes.townhouse",
    studio: "property.buildingTypes.studio",
    chalet: "property.buildingTypes.chalet",
    twinhouse: "property.buildingTypes.twinhouse",
    standalone: "property.buildingTypes.standalone",
    bungalow: "property.buildingTypes.bungalow",
    commercial: "property.buildingTypes.commercial",
    office: "property.buildingTypes.office",
    retail: "property.buildingTypes.retail",
    administrative: "property.buildingTypes.administrative",
    land: "property.buildingTypes.land",
    // Add all other building types...
  },

  // Purpose mapping
  purposes: {
    sell: "property.purpose.sell",
    rent: "property.purpose.rent",
    buy: "property.purpose.buy",
    lease: "property.purpose.lease",
  },

  // Property status mapping
  propertyStatus: {
    "ready to move": "property.status.readyToMove",
    "off-plan": "property.status.offPlan",
  },

  // Property usage mapping
  propertyUsage: {
    residential: "property.usage.residential",
    commercial: "property.usage.commercial",
    "mixed-use": "property.usage.mixedUse",
  },

  // Finishing types mapping
  finishingTypes: {
    finished: "property.finishing.finished",
    "fully finished": "property.finishing.fullyFinished",
    "semi-finished": "property.finishing.semiFinished",
    "semi finished": "property.finishing.semiFinished",
    "core & shell": "property.finishing.coreShell",
    "core and shell": "property.finishing.coreShell",
    unfinished: "property.finishing.unfinished",
    "white box": "property.finishing.whiteBox",
    flixy: "property.finishing.flixy",
    turnkey: "property.furnishing.turnkey",
  },

  // Furnishing types mapping
  furnishingTypes: {
    furnished: "property.furnishing.furnished",
    unfurnished: "property.furnishing.unfurnished",
    "partially furnished": "property.furnishing.partiallyFurnished",
    "semi furnished": "property.furnishing.semiFurnished",
    hotel_furnished: "property.furnishing.hotelFurnished",
    flixy: "property.furnishing.flixy",
    turnkey: "property.furnishing.turnkey",
  },

  // View types mapping
  viewTypes: {
    garden: "property.view.garden",
    pool: "property.view.pool",
    sea: "property.view.sea",
    landmark: "property.view.landmark",
    street: "property.view.street",
    other: "property.view.other",
    mountain: "property.view.mountain",
    city: "property.view.city",
    park: "property.view.park",
    lake: "property.view.lake",
    golf: "property.view.golf",
    partial: "property.view.partial",
    open: "property.view.open",
    desert: "property.view.desert",
    river: "property.view.river",
    courtyard: "property.view.courtyard",
    forest: "property.view.forest",
    beach: "property.view.beach",
    lagoon: "property.view.lagoon",
    openArea: "property.view.openArea",
  },

  // Delivery status mapping
  deliveryStatus: {
    ready: "property.delivery.ready",
    underConstruction: "property.delivery.underConstruction",
    offPlan: "property.delivery.offPlan",
  },

  // Action types mapping (for dashboard)
  actionTypes: {
    Monitorlead: "dashboard.actionTypes.monitorLead",
    makeCall: "dashboard.actionTypes.makeCall",
    officeVisit: "dashboard.actionTypes.officeVisit",
    propertyView: "dashboard.actionTypes.propertyView",
    Interested: "dashboard.actionTypes.interested",
    notInterested: "dashboard.actionTypes.notInterested",
    notQualified: "dashboard.actionTypes.notQualified",
    didNotReply: "dashboard.actionTypes.didNotReply",
    followUpLater: "dashboard.actionTypes.followUpLater",
    missingRequirement: "dashboard.actionTypes.missingRequirement",
    blocked: "dashboard.actionTypes.blocked",
    print: "dashboard.actionTypes.print",
    exportExcel: "dashboard.actionTypes.exportExcel",
    onGoingConversion: "dashboard.actionTypes.onGoingConversion",
    qualifiedLead: "dashboard.actionTypes.qualifiedLead",
    noAction: "dashboard.actionTypes.noAction",
  },

  // Amenities mapping
  amenities: {
    wifi: "property.amenities.wifi",
    dryer: "property.amenities.dryer",
    air_conditioning: "property.amenities.airConditioning",
    heating: "property.amenities.heating",
    smart_tv: "property.amenities.smartTv",
    hair_dryer: "property.amenities.hairDryer",
    pool: "property.amenities.pool",
    free_parking: "property.amenities.freeParking",
    ev_charger: "property.amenities.evCharger",
    bbq_grill: "property.amenities.bbqGrill",
    indoor_fireplace: "property.amenities.indoorFireplace",
    smoking_allowed: "property.amenities.smokingAllowed",
    beachfront: "property.amenities.beachfront",
    smoke_alarm: "property.amenities.smokeAlarm",
    co_alarm: "property.amenities.coAlarm",
  },
};

// Helper function to get translated value from mapping
export const getMappedTranslation = (value, mapping, t) => {
  if (!value || !mapping || !t) return value;
  
  const key = mapping[value?.toString().toLowerCase()];
  if (key && typeof t === 'function') {
    return t(key);
  }
  
  // Try nested object access for t
  const keys = key?.split('.');
  if (keys && t) {
    let result = t;
    for (const k of keys) {
      result = result?.[k];
    }
    return result || value;
  }
  
  return value;
};

// Date and number localization helpers
export const formatDate = (date, locale = 'en') => {
  if (!date) return '';
  
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  } catch (error) {
    console.warn('Date formatting error:', error?.message ?? error);
    return date;
  }
};

export const formatNumber = (number, locale = 'en') => {
  if (number === null || number === undefined) return '';
  
  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(number);
  } catch (error) {
    console.warn('Number formatting error:', error?.message ?? error);
    return number;
  }
};

export const formatCurrency = (amount, currency = 'EGP', locale = 'en') => {
  if (amount === null || amount === undefined) return '';
  
  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    console.warn('Currency formatting error:', error?.message ?? error);
    return `${currency} ${amount}`;
  }
};
