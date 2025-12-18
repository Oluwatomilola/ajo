import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface NotificationContextType {
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  notifications: Notification[];
}

// Create context for notifications
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration (unless persistent)
    if (!notification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, notifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use notifications
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Individual notification component
function NotificationItem({ 
  notification, 
  onRemove 
}: { 
  notification: Notification; 
  onRemove: (id: string) => void; 
}) {
  useEffect(() => {
    if (notification.persistent) return;

    const timer = setTimeout(() => {
      onRemove(notification.id);
    }, notification.duration);

    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, notification.persistent, onRemove]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getStyles = () => {
    const baseStyles = 'notification-item';
    const typeStyles = {
      success: 'notification-success',
      error: 'notification-error',
      warning: 'notification-warning',
      info: 'notification-info',
    };
    return `${baseStyles} ${typeStyles[notification.type]}`;
  };

  return (
    <div className={getStyles()} role="alert" aria-live="polite">
      <div className="notification-content">
        <span className="notification-icon">{getIcon()}</span>
        <div className="notification-text">
          <div className="notification-title">{notification.title}</div>
          {notification.message && (
            <div className="notification-message">{notification.message}</div>
          )}
        </div>
        <button 
          className="notification-close"
          onClick={() => onRemove(notification.id)}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Notification container component
export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container" aria-live="polite" aria-atomic="false">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
}

// Secure alert replacement functions
export function createSecureAlerts() {
  const context = useContext(NotificationContext);
  
  const showSecureAlert = {
    success: (title: string, message?: string) => {
      context?.addNotification({ type: 'success', title, message });
    },
    error: (title: string, message?: string) => {
      context?.addNotification({ type: 'error', title, message, persistent: true });
    },
    warning: (title: string, message?: string) => {
      context?.addNotification({ type: 'warning', title, message });
    },
    info: (title: string, message?: string) => {
      context?.addNotification({ type: 'info', title, message });
    },
  };

  return showSecureAlert;
}

// Hook for secure alerts
export function useSecureAlert() {
  const { addNotification } = useNotification();
  
  return {
    success: (title: string, message?: string) => {
      addNotification({ type: 'success', title, message });
    },
    error: (title: string, message?: string) => {
      addNotification({ type: 'error', title, message, persistent: true });
    },
    warning: (title: string, message?: string) => {
      addNotification({ type: 'warning', title, message });
    },
    info: (title: string, message?: string) => {
      addNotification({ type: 'info', title, message });
    },
  };
}