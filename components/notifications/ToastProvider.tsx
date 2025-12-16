'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Toast, ToastType } from './Toast';

export interface ToastData {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface ToastContextType {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  defaultPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  defaultDuration?: number;
}

export function ToastProvider({
  children,
  maxToasts = 5,
  defaultPosition = 'top-right',
  defaultDuration = 5000
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toastData: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 15);
    const newToast: ToastData = {
      id,
      duration: defaultDuration,
      dismissible: true,
      ...toastData
    };

    setToasts(prevToasts => {
      const updatedToasts = [newToast, ...prevToasts];
      // Remove oldest toasts if we exceed maxToasts
      return updatedToasts.slice(0, maxToasts);
    });

    return id;
  }, [defaultDuration, maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
      {children}

      {/* Toast Container */}
      <div
        className={`
          fixed z-[100] flex flex-col gap-2 pointer-events-none
          ${positionClasses[defaultPosition]}
        `}
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook to use toast context
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast, removeToast, clearAllToasts } = context;

  // Convenience methods for different toast types
  const toast = {
    success: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) =>
      addToast({ type: 'success', message, ...options }),

    error: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) =>
      addToast({ type: 'error', message, ...options }),

    warning: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) =>
      addToast({ type: 'warning', message, ...options }),

    info: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) =>
      addToast({ type: 'info', message, ...options }),

    loading: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) =>
      addToast({ type: 'loading', message, dismissible: false, duration: 0, ...options }),

    // Generic method
    show: addToast,

    // Utility methods
    dismiss: removeToast,
    clear: clearAllToasts
  };

  return toast;
}