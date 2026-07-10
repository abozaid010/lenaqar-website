'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { UseMutationResult } from '@tanstack/react-query';
import DeleteConfirmDialog from '@/components/ui/confirm-delete-dialog';
import { useI18n } from '@/hooks/useI18n';
import { useDeleteUnit } from '@/hooks/use-unit-mutations';
import { useUnitOwnership } from '@/hooks/useUnitOwnership';
import { useUnitsSectionSource } from '@/hooks/use-units-section-source';
import { buildAdminUnitEditPath } from '@/lib/units/unit-share-links';
import type { RawUnit, UnitViewModel } from '@/lib/units/unit-types';
import {
  appendUnitsSourcePendingQuery,
  buildAdminPendingApprovalListPath,
} from '@/utils/units-navigation-source';
import UnitApproveButton, { isUnitPendingApproval } from './unit-approve-button';

/** TEMP: set to true to restore the pending-approval approve action on unit detail. */
const SHOW_UNIT_APPROVE_BUTTON = false;

interface UnitDetailsAdminActionsProps {
  unit: UnitViewModel;
  rawUnit?: RawUnit;
  isOwnUnit?: boolean;
}

export default function UnitDetailsAdminActions({
  unit,
  rawUnit,
  isOwnUnit: isOwnUnitProp,
}: UnitDetailsAdminActionsProps) {
  const { locale, translate } = useI18n();
  const router = useRouter();
  const { myClientId: currentClientId, isOwnUnit: isOwnUnitFromHook } = useUnitOwnership(unit);
  const isOwnUnit = isOwnUnitProp ?? isOwnUnitFromHook;
  const unitsSection = useUnitsSectionSource();
  const showApproveButton = SHOW_UNIT_APPROVE_BUTTON && Boolean(
    rawUnit && isUnitPendingApproval(rawUnit, unitsSection === 'pending_approval'),
  );
  const deleteUnitMutation = useDeleteUnit() as unknown as UseMutationResult<
    string,
    Error,
    string,
    unknown
  >;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOwnUnit) {
    return null;
  }

  const handleEdit = () => {
    if (!unit.referenceCode?.trim()) return;
    const editUrl = appendUnitsSourcePendingQuery(
      buildAdminUnitEditPath(unit.referenceCode, currentClientId),
      unitsSection === 'pending_approval',
    );
    router.push(editUrl);
  };

  const handleDelete = async () => {
    if (!unit?.id) return;
    try {
      await deleteUnitMutation.mutateAsync(unit.id);
      toast.success(
        translate('toasts.unitDeleted') ||
          (locale === 'ar' ? 'تم حذف الوحدة بنجاح' : 'Unit deleted successfully'),
      );
      setShowDeleteConfirm(false);
      router.push(
        unitsSection === 'pending_approval'
          ? buildAdminPendingApprovalListPath(currentClientId)
          : '/units',
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : translate('toasts.errorProcessing') ||
            (locale === 'ar' ? 'حدث خطأ أثناء معالجة الطلب' : 'Failed to process request');
      toast.error(message);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        {showApproveButton && rawUnit ? (
          <UnitApproveButton rawUnit={rawUnit} variant="header" />
        ) : null}

        {unit.referenceCode?.trim() ? (
          <button
            type="button"
            onClick={handleEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-300 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {translate('buttons.edit')}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {translate('buttons.delete')}
        </button>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          if (!deleteUnitMutation.isPending) setShowDeleteConfirm(false);
        }}
        onConfirm={handleDelete}
        title={translate(
          'unitPage.deleteUnit',
          locale === 'ar' ? 'حذف الوحدة' : 'Delete Unit',
        )}
        message={translate(
          'unitPage.confirmDeleteMsg',
          locale === 'ar'
            ? 'هل أنت متأكد أنك تريد حذف هذه الوحدة؟'
            : 'Are you sure you want to delete this unit?',
        )}
        confirmLabel={
          deleteUnitMutation.isPending
            ? translate('common.loading', locale === 'ar' ? 'جارٍ الحذف...' : 'Deleting...')
            : translate('buttons.delete', locale === 'ar' ? 'حذف' : 'Delete')
        }
        cancelLabel={translate('buttons.cancel', locale === 'ar' ? 'إلغاء' : 'Cancel')}
      />
    </>
  );
}
