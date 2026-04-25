"use client";

import { useI18n } from "@/hooks/useI18n";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import AddUnitButton from "./add-unit-button";
import DeleteUnitBtn from "./delete-unit-btn";
import { useBrokerPermission } from "@/hooks/useBrokerPermission";

export default function UnitPageHeader({ unit }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const u = unit || {};
  const unitId = u.unitId ?? u.id;
  const { canModify } = useBrokerPermission();
  const canEdit = canModify(u);

  const handleBackToUnits = () => {
    router.back();
  };

  return (
    <div className="py-4 flex justify-between items-between overflow-hidden">
      <button
        onClick={handleBackToUnits}
        className="cursor-pointer bg-gray-500 text-white px-[16px] py-[10px] h-[40px] rounded-md flex items-center gap-2"
      >
        {locale === "ar" ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        <span>{t.unitPage?.backToUnits}</span>
      </button>

      <div className="flex gap-2">
        <AddUnitButton isEdit={true} unitData={u} disabled={!canEdit} />
        {unitId && <DeleteUnitBtn unitId={unitId} disabled={!canEdit} />}
      </div>
    </div>
  );
}
