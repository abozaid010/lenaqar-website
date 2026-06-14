"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  getUnitSelectionIdFromListItem,
  unitToWhatsappRecipient,
} from "@/lib/units/unit-whatsapp-recipient";

const UnitsBulkSelectionContext = createContext(null);

export { unitToWhatsappRecipient };

export function UnitsBulkSelectionProvider({ children, clientId = "" }) {
  const [visibleUnits, setVisibleUnits] = useState([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState(() => new Set());

  const setVisibleUnitsFromList = useCallback((units) => {
    setVisibleUnits(Array.isArray(units) ? units : []);
  }, []);

  const toggleUnitSelection = useCallback((unitId) => {
    if (!unitId) return;
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedUnitIds((prev) => {
      const selectableIds = visibleUnits
        .map((unit) => {
          if (!unitToWhatsappRecipient(unit, clientId)) return null;
          return getUnitSelectionIdFromListItem(unit);
        })
        .filter(Boolean);

      if (selectableIds.length === 0) return prev;

      const allSelected = selectableIds.every((id) => prev.has(id));
      if (allSelected) return new Set();

      return new Set(selectableIds);
    });
  }, [visibleUnits, clientId]);

  const clearUnitSelection = useCallback(() => {
    setSelectedUnitIds(new Set());
  }, []);

  const isUnitSelected = useCallback(
    (unitId) => selectedUnitIds.has(unitId),
    [selectedUnitIds]
  );

  const selectedUnits = useMemo(() => {
    if (selectedUnitIds.size === 0) return [];
    return visibleUnits.filter((unit) => {
      const unitId = getUnitSelectionIdFromListItem(unit);
      return unitId && selectedUnitIds.has(unitId);
    });
  }, [visibleUnits, selectedUnitIds]);

  const resolvedRecipients = useMemo(() => {
    const recipients = [];
    for (const unit of selectedUnits) {
      const recipient = unitToWhatsappRecipient(unit, clientId);
      if (!recipient) continue;
      recipients.push(recipient);
    }
    return recipients;
  }, [selectedUnits, clientId]);

  const selectableVisibleCount = useMemo(
    () =>
      visibleUnits.filter(
        (unit) => unitToWhatsappRecipient(unit, clientId) != null
      ).length,
    [visibleUnits, clientId]
  );

  const allSelectableVisibleSelected = useMemo(() => {
    const selectableIds = visibleUnits
      .map((unit) => {
        if (!unitToWhatsappRecipient(unit, clientId)) return null;
        return getUnitSelectionIdFromListItem(unit);
      })
      .filter(Boolean);

    if (selectableIds.length === 0) return false;
    return selectableIds.every((id) => selectedUnitIds.has(id));
  }, [visibleUnits, selectedUnitIds, clientId]);

  const value = useMemo(
    () => ({
      visibleUnits,
      selectedUnitIds,
      selectedUnits,
      resolvedRecipients,
      selectableVisibleCount,
      allSelectableVisibleSelected,
      setVisibleUnitsFromList,
      toggleUnitSelection,
      toggleSelectAllVisible,
      clearUnitSelection,
      isUnitSelected,
      hasSelection: selectedUnitIds.size > 0,
    }),
    [
      visibleUnits,
      selectedUnitIds,
      selectedUnits,
      resolvedRecipients,
      selectableVisibleCount,
      allSelectableVisibleSelected,
      setVisibleUnitsFromList,
      toggleUnitSelection,
      toggleSelectAllVisible,
      clearUnitSelection,
      isUnitSelected,
    ]
  );

  return (
    <UnitsBulkSelectionContext.Provider value={value}>
      {children}
    </UnitsBulkSelectionContext.Provider>
  );
}

export function useUnitsBulkSelection() {
  const ctx = useContext(UnitsBulkSelectionContext);
  if (!ctx) {
    throw new Error(
      "useUnitsBulkSelection must be used within UnitsBulkSelectionProvider"
    );
  }
  return ctx;
}

export function useUnitsBulkSelectionOptional() {
  return useContext(UnitsBulkSelectionContext);
}
