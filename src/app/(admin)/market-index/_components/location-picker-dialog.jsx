"use client";

import { useEffect, useState } from "react";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import { useI18n } from "@/hooks/useI18n";
import MarketLocationSearch from "./market-location-search";

export default function LocationPickerDialog({ isOpen, onClose, onConfirm }) {
  const { translate } = useI18n();
  const [leaf, setLeaf] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLeaf(null);
  }, [isOpen]);

  const canConfirm = leaf?.is_leaf === true;

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={translate("marketIndex.picker.title")}
      cancelLabel={translate("common.cancel")}
      submitLabel={translate("marketIndex.picker.confirm")}
      submitDisabled={!canConfirm}
      onSubmit={() => {
        if (canConfirm) onConfirm(leaf.id);
      }}
      dialogClassName="max-w-2xl"
      bodyClassName="p-4 overflow-y-auto"
    >
      <MarketLocationSearch
        enabled={isOpen}
        leaf={leaf}
        onLeafChange={setLeaf}
      />
    </UnifiedDialog>
  );
}
