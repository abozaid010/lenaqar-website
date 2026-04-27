import type { ReactNode } from 'react';

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

declare function DeleteConfirmDialog(
  props: DeleteConfirmDialogProps
): ReactNode;

export default DeleteConfirmDialog;
