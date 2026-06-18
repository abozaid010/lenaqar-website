'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { UseMutationResult } from '@tanstack/react-query';
import { useI18n } from '@/hooks/useI18n';
import { useApproveUnitVisibility } from '@/hooks/use-unit-mutations';
import { useUnitsSectionSource } from '@/hooks/use-units-section-source';
import { buildAdminPendingApprovalListPath } from '@/utils/units-navigation-source';
import { LenaCookiesManager } from '@/lib/LenaCookiesManager';
import type { RawUnit } from '@/lib/units/unit-types';

interface UnitApproveButtonProps {
  rawUnit: RawUnit;
  variant?: 'header' | 'inline';
  className?: string;
}

export function isUnitPendingApproval(
  rawUnit?: RawUnit | null,
  fromPendingSection = false
): boolean {
  const visibility = rawUnit?.visibility ?? rawUnit?.status;
  if (typeof visibility === 'string' && visibility.trim() === 'pending_approval') {
    return true;
  }
  return fromPendingSection;
}

export default function UnitApproveButton({
  rawUnit,
  variant = 'inline',
  className = '',
}: UnitApproveButtonProps) {
  const { translate } = useI18n();
  const router = useRouter();
  const approveMutation = useApproveUnitVisibility() as unknown as UseMutationResult<
    string | undefined,
    Error,
    RawUnit,
    unknown
  >;
  const unitsSection = useUnitsSectionSource();
  const fromPendingSection = unitsSection === 'pending_approval';

  if (!isUnitPendingApproval(rawUnit, fromPendingSection)) {
    return null;
  }

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(rawUnit);
      toast.success(
        translate('toasts.unitApproved', 'Unit approved successfully')
      );

      const clientId = LenaCookiesManager.getClientId();
      const pendingPath = buildAdminPendingApprovalListPath(clientId);

      if (fromPendingSection) {
        router.push(pendingPath);
      } else if (typeof window !== 'undefined' && window.history.length > 2) {
        router.back();
      } else {
        router.push(pendingPath);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : translate('toasts.errorProcessing', 'Failed to process request');
      toast.error(message);
    }
  };

  const baseClass =
    variant === 'header'
      ? 'inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
      : 'w-full border border-primary bg-primary text-white rounded-lg py-2 px-3 font-medium hover:opacity-90 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <button
      type="button"
      onClick={handleApprove}
      disabled={approveMutation.isPending}
      className={`${baseClass} ${className}`.trim()}
    >
      {approveMutation.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CheckCircle2 className="w-4 h-4" />
      )}
      {translate('buttons.approveUnit', 'Approve')}
    </button>
  );
}
