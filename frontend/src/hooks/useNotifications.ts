import { useSelector, useDispatch } from 'react-redux';
import { addNotification, removeNotification, clearNotifications } from '@/store/slices/uiSlice';
import type { RootState } from '@/store';

export interface NotificationOptions {
  id?: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function useNotifications() {
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.ui.notifications);

  const notify = ({
    id,
    title,
    message,
    type = 'info',
    duration = 5000,
    persistent = false,
    action,
  }: NotificationOptions) => {
    const notificationId = id || `notification-${Date.now()}-${Math.random()}`;
    
    dispatch(addNotification({
      id: notificationId,
      title,
      message,
      type,
      duration,
      persistent,
      action,
      timestamp: new Date().toISOString(),
    }));

    // Auto-remove notification after duration (unless persistent)
    if (!persistent && duration > 0) {
      setTimeout(() => {
        dispatch(removeNotification(notificationId));
      }, duration);
    }

    return notificationId;
  };

  const success = (message: string, options?: Omit<NotificationOptions, 'message' | 'type'>) => {
    return notify({ ...options, message, type: 'success' });
  };

  const error = (message: string, options?: Omit<NotificationOptions, 'message' | 'type'>) => {
    return notify({ ...options, message, type: 'error', persistent: true });
  };

  const warning = (message: string, options?: Omit<NotificationOptions, 'message' | 'type'>) => {
    return notify({ ...options, message, type: 'warning' });
  };

  const info = (message: string, options?: Omit<NotificationOptions, 'message' | 'type'>) => {
    return notify({ ...options, message, type: 'info' });
  };

  const remove = (id: string) => {
    dispatch(removeNotification(id));
  };

  const clear = () => {
    dispatch(clearNotifications());
  };

  return {
    notifications,
    notify,
    success,
    error,
    warning,
    info,
    remove,
    clear,
  };
}

export default useNotifications;
