'use client';

import React, { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import { Button } from '../form/Button';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastProps {
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
  onDismiss: () => void;
}

export function Toast({
  type,
  title,
  message,
  duration = 5000,
  action,
  dismissible = true,
  onDismiss
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Auto-dismiss timer
  useEffect(() => {
    if (!duration || duration === 0) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    if (!dismissible) return;

    setIsRemoving(true);
    setTimeout(() => {
      onDismiss();
    }, 200); // Match exit animation duration
  };

  const handleActionClick = () => {
    if (action) {
      action.onClick();
      handleDismiss();
    }
  };

  // Toast configuration by type
  const toastConfig = {
    success: {
      icon: 'check_circle',
      iconColor: 'text-success-main',
      bgColor: 'bg-success-container',
      textColor: 'text-success-on-container',
      borderColor: 'border-success-main/20'
    },
    error: {
      icon: 'error',
      iconColor: 'text-error-main',
      bgColor: 'bg-error-container',
      textColor: 'text-error-on-container',
      borderColor: 'border-error-main/20'
    },
    warning: {
      icon: 'warning',
      iconColor: 'text-warning-main',
      bgColor: 'bg-warning-container',
      textColor: 'text-warning-on-container',
      borderColor: 'border-warning-main/20'
    },
    info: {
      icon: 'info',
      iconColor: 'text-primary-main',
      bgColor: 'bg-primary-container',
      textColor: 'text-primary-on-container',
      borderColor: 'border-primary-main/20'
    },
    loading: {
      icon: 'progress_activity',
      iconColor: 'text-surface-on-surface/60',
      bgColor: 'bg-surface-container-high',
      textColor: 'text-surface-on-surface',
      borderColor: 'border-outline-variant'
    }
  };

  const config = toastConfig[type];

  return (
    <div
      className={`
        transform transition-all duration-200 ease-emphasized pointer-events-auto
        ${isVisible && !isRemoving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
        }
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className={`
        relative rounded-lg shadow-lg border backdrop-blur-sm
        min-w-[320px] max-w-[500px] p-4
        ${config.bgColor} ${config.textColor} ${config.borderColor}
      `}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {type === 'loading' ? (
              <div className="animate-spin">
                <Icon
                  name={config.icon}
                  size="sm"
                  className={config.iconColor}
                  decorative={false}
                  aria-label={type}
                />
              </div>
            ) : (
              <Icon
                name={config.icon}
                size="sm"
                className={config.iconColor}
                decorative={false}
                aria-label={type}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="font-medium text-sm mb-1">
                {title}
              </h4>
            )}
            <p className="text-sm leading-relaxed">
              {message}
            </p>

            {/* Action button */}
            {action && (
              <div className="mt-3">
                <Button
                  variant="text"
                  size="sm"
                  onClick={handleActionClick}
                  className="h-6 px-2 text-xs"
                >
                  {action.label}
                </Button>
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className={`
                flex-shrink-0 p-1 rounded-md transition-colors
                hover:bg-surface-state-hover focus:bg-surface-state-focus
                focus:outline-none
                ${config.textColor}
              `}
              aria-label="Dismiss notification"
            >
              <Icon
                name="close"
                size="xs"
                decorative={false}
              />
            </button>
          )}
        </div>

        {/* Progress bar for timed toasts */}
        {duration && duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-state-hover/20 rounded-b-lg overflow-hidden">
            <div
              className={`h-full bg-current opacity-60`}
              style={{
                animation: `toast-progress ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}