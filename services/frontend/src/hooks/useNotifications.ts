import { useState, useCallback, useEffect } from 'react';
import { useSnackbar } from 'notistack';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'text' | 'outlined' | 'contained';
}

export const useNotifications = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Show snackbar
    enqueueSnackbar(notification.message, {
      variant: notification.type,
      autoHideDuration: notification.type === 'error' ? 8000 : 5000,
      action: notification.actions ? (key) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {notification.actions!.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.action();
                closeSnackbar(key);
              }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : undefined
    });

    return newNotification.id;
  }, [enqueueSnackbar, closeSnackbar]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for different notification types
  const success = useCallback((message: string, title?: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'success',
      title: title || 'Sucesso',
      message,
      actions
    });
  }, [addNotification]);

  const error = useCallback((message: string, title?: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'error',
      title: title || 'Erro',
      message,
      actions
    });
  }, [addNotification]);

  const warning = useCallback((message: string, title?: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'warning',
      title: title || 'Atenção',
      message,
      actions
    });
  }, [addNotification]);

  const info = useCallback((message: string, title?: string, actions?: NotificationAction[]) => {
    return addNotification({
      type: 'info',
      title: title || 'Informação',
      message,
      actions
    });
  }, [addNotification]);

  // Update unread count
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };
};
