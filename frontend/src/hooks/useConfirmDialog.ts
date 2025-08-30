import { useSelector, useDispatch } from 'react-redux';
import { 
  openConfirmDialog, 
  closeConfirmDialog, 
  setConfirmDialogLoading 
} from '@/store/slices/uiSlice';
import type { RootState } from '@/store';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

function useConfirmDialog() {
  const dispatch = useDispatch();
  const confirmDialog = useSelector((state: RootState) => state.ui.confirmDialog);

  const confirm = (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const handleConfirm = async () => {
        try {
          if (options.onConfirm) {
            dispatch(setConfirmDialogLoading(true));
            await options.onConfirm();
          }
          dispatch(closeConfirmDialog());
          resolve(true);
        } catch (error) {
          console.error('Confirm action failed:', error);
          dispatch(setConfirmDialogLoading(false));
          // Don't close dialog on error, let user retry
        }
      };

      const handleCancel = () => {
        if (options.onCancel) {
          options.onCancel();
        }
        dispatch(closeConfirmDialog());
        resolve(false);
      };

      dispatch(openConfirmDialog({
        title: options.title || 'Confirm Action',
        message: options.message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'default',
        onConfirm: handleConfirm,
        onCancel: handleCancel,
      }));
    });
  };

  const confirmDelete = (
    itemName: string, 
    onConfirm?: () => void | Promise<void>
  ): Promise<boolean> => {
    return confirm({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm,
    });
  };

  const confirmAction = (
    action: string,
    onConfirm?: () => void | Promise<void>
  ): Promise<boolean> => {
    return confirm({
      title: 'Confirm Action',
      message: `Are you sure you want to ${action}?`,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: 'default',
      onConfirm,
    });
  };

  const confirmWarning = (
    message: string,
    onConfirm?: () => void | Promise<void>
  ): Promise<boolean> => {
    return confirm({
      title: 'Warning',
      message,
      confirmText: 'Continue',
      cancelText: 'Cancel',
      variant: 'warning',
      onConfirm,
    });
  };

  const close = () => {
    dispatch(closeConfirmDialog());
  };

  return {
    confirmDialog,
    confirm,
    confirmDelete,
    confirmAction,
    confirmWarning,
    close,
  };
}

export default useConfirmDialog;
