"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/useI18n";
import DeleteConfirmDialog from "@/components/ui/confirm-delete-dialog";
import { useDeleteUnit, useSaveUnit } from "@/hooks/use-market-index";
import UnitFormDialog from "./unit-form-dialog";

function formatDate(value, locale) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

export default function ReferenceUnitsTable({
  locationId,
  units = [],
  canEdit = true,
  readOnly = false,
}) {
  const { translate, locale } = useI18n();
  const editable = canEdit && !readOnly;
  const [formOpen, setFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const saveMutation = useSaveUnit(locationId);
  const deleteMutation = useDeleteUnit(locationId);

  const openCreate = () => {
    setEditingUnit(null);
    setFormOpen(true);
  };

  const openEdit = (unit) => {
    setEditingUnit(unit);
    setFormOpen(true);
  };

  const handleSave = async (body) => {
    try {
      await saveMutation.mutateAsync(body);
      toast.success(translate("marketIndex.toasts.unitSaved"));
      setFormOpen(false);
      setEditingUnit(null);
    } catch (err) {
      toast.error(err?.message || translate("marketIndex.errors.saveFailed"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(translate("marketIndex.toasts.unitDeleted"));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.message || translate("marketIndex.errors.deleteFailed"));
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-base font-semibold text-gray-900">
          {translate("marketIndex.sections.units")}
        </h3>
        {editable && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {translate("marketIndex.actions.addUnit")}
          </button>
        )}
      </div>

      {units.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500 text-sm">
          {translate("marketIndex.empty.units")}
        </div>
      ) : (
        <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-sm text-start">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 font-medium text-gray-600">
                  {translate("marketIndex.fields.propertyType")}
                </th>
                <th className="px-3 py-2 font-medium text-gray-600">
                  {translate("marketIndex.fields.areaSqm")}
                </th>
                <th className="px-3 py-2 font-medium text-gray-600">
                  {translate("marketIndex.fields.bedsBaths")}
                </th>
                <th className="px-3 py-2 font-medium text-gray-600">
                  {translate("marketIndex.fields.estimatedAvgPrice")}
                </th>
                <th className="px-3 py-2 font-medium text-gray-600">
                  {translate("marketIndex.fields.priceRange")}
                </th>
                <th className="px-3 py-2 font-medium text-gray-600">
                  {translate("marketIndex.fields.developerPrice")}
                </th>
                <th className="px-3 py-2 font-medium text-gray-600">
                  {translate("marketIndex.fields.rents")}
                </th>
                <th className="px-3 py-2 font-medium text-gray-600">
                  {translate("marketIndex.evidence.title")}
                </th>
                <th className="px-3 py-2 font-medium text-gray-600">
                  {translate("marketIndex.table.updatedAt")}
                </th>
                {editable && (
                  <th className="px-3 py-2 font-medium text-gray-600">
                    {translate("marketIndex.table.actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id} className="border-b border-gray-100">
                  <td className="px-3 py-2">{unit.property_type}</td>
                  <td className="px-3 py-2">{unit.area_sqm}</td>
                  <td className="px-3 py-2">
                    {unit.bedrooms}/{unit.bathrooms}
                  </td>
                  <td className="px-3 py-2">{unit.estimated_avg_price}</td>
                  <td className="px-3 py-2">
                    {unit.price_range?.low} – {unit.price_range?.high}
                  </td>
                  <td className="px-3 py-2">{unit.developer_price ?? "—"}</td>
                  <td className="px-3 py-2">
                    {unit.monthly_rent ?? "—"} /{" "}
                    {unit.monthly_furnished_rent ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {Array.isArray(unit.evidence) ? unit.evidence.length : 0}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {formatDate(unit.updated_at, locale)}
                  </td>
                  {editable && (
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(unit)}
                          className="p-1.5 text-primary hover:bg-primary/5 rounded"
                          aria-label={translate("common.edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(unit)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          aria-label={translate("common.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editable && (
        <>
          <UnitFormDialog
            isOpen={formOpen}
            onClose={() => {
              setFormOpen(false);
              setEditingUnit(null);
            }}
            unit={editingUnit}
            onSubmit={handleSave}
            submitLoading={saveMutation.isPending}
          />
          <DeleteConfirmDialog
            isOpen={Boolean(deleteTarget)}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title={translate("marketIndex.unit.deleteTitle")}
            message={translate("marketIndex.unit.deleteMessage")}
            confirmLabel={translate("common.delete")}
            cancelLabel={translate("common.cancel")}
          />
        </>
      )}
    </section>
  );
}
