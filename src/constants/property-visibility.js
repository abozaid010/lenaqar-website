/** Mirrors backend PropertyVisibility enum. */
export const PROPERTY_VISIBILITY = {
  PENDING_APPROVAL: "pending_approval",
  VISIBLE: "visible",
  HIDDEN: "hidden",
  RENTED: "rented",
  SOLD: "sold",
};

export const PROPERTY_VISIBILITY_VALUES = Object.values(PROPERTY_VISIBILITY);

export function normalizePropertyVisibility(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

/** True when unit is not marked as rented (available for rent in UI). */
export function isRentVisibilityAvailable(visibility) {
  return normalizePropertyVisibility(visibility) !== PROPERTY_VISIBILITY.RENTED;
}

/** Map "Available for rent" checkbox to visibility; preserves non-rented values when re-enabling. */
export function resolveRentVisibilityForCheckbox(checked, currentVisibility) {
  const normalized = normalizePropertyVisibility(currentVisibility);
  if (!checked) return PROPERTY_VISIBILITY.RENTED;
  if (normalized === PROPERTY_VISIBILITY.RENTED) return PROPERTY_VISIBILITY.VISIBLE;
  return normalized || PROPERTY_VISIBILITY.VISIBLE;
}

export function getUnitVisibility(unit) {
  return normalizePropertyVisibility(unit?.visibility ?? unit?.status);
}

/** True when unit belongs on the hidden / pending-approval list. */
export function isPendingOrHiddenVisibility(value) {
  const v = normalizePropertyVisibility(value);
  return (
    v === PROPERTY_VISIBILITY.PENDING_APPROVAL || v === PROPERTY_VISIBILITY.HIDDEN
  );
}
