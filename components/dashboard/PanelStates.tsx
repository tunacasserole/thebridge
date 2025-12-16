'use client';

import React from 'react';
import { Icon } from '@/components/ui';

interface PanelSkeletonProps {
  /** Number of skeleton rows to show */
  rows?: number;
  /** Show header skeleton */
  showHeader?: boolean;
  /** Show stats cards skeleton */
  showStats?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Reusable skeleton loader for dashboard panels
 * Provides consistent loading states across all integration panels
 */
export function PanelSkeleton({
  rows = 4,
  showHeader = true,
  showStats = true,
  className = '',
}: PanelSkeletonProps) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {/* Header skeleton */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-full animate-pulse"
            style={{ background: 'var(--md-surface-container-highest)' }}
          />
          <div className="flex-1">
            <div
              className="h-5 w-40 rounded animate-pulse mb-2"
              style={{ background: 'var(--md-surface-container-highest)' }}
            />
            <div
              className="h-3 w-24 rounded animate-pulse"
              style={{ background: 'var(--md-surface-container-highest)' }}
            />
          </div>
        </div>
      )}

      {/* Stats skeleton */}
      {showStats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2].map(i => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse"
              style={{
                background: 'var(--md-surface-container-high)',
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Content rows skeleton */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 animate-pulse"
            style={{
              background: 'var(--md-surface-container-high)',
              animationDelay: `${(i + 2) * 100}ms`,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-3 h-3 rounded-full mt-1"
                style={{ background: 'var(--md-surface-container-highest)' }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-4 w-16 rounded"
                    style={{ background: 'var(--md-surface-container-highest)' }}
                  />
                  <div
                    className="h-4 w-20 rounded-full"
                    style={{ background: 'var(--md-surface-container-highest)' }}
                  />
                </div>
                <div
                  className="h-5 w-3/4 rounded mb-2"
                  style={{ background: 'var(--md-surface-container-highest)' }}
                />
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-16 rounded"
                    style={{ background: 'var(--md-surface-container-highest)' }}
                  />
                  <div
                    className="h-3 w-24 rounded"
                    style={{ background: 'var(--md-surface-container-highest)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type ErrorSeverity = 'error' | 'warning' | 'info';

interface PanelErrorProps {
  /** Error title */
  title: string;
  /** Error message - can be technical error or user-friendly message */
  message: string;
  /** Icon to display */
  icon?: string;
  /** Severity level affects color scheme */
  severity?: ErrorSeverity;
  /** Retry callback */
  onRetry?: () => void;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Additional helpful tips or troubleshooting steps */
  tips?: string[];
  /** Custom className */
  className?: string;
}

const severityConfig: Record<ErrorSeverity, { bg: string; border: string; color: string; icon: string }> = {
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    icon: 'error',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
    color: '#f59e0b',
    icon: 'warning',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.3)',
    color: '#3b82f6',
    icon: 'info',
  },
};

/**
 * Reusable error state for dashboard panels
 * Provides consistent, user-friendly error messaging across all integration panels
 */
export function PanelError({
  title,
  message,
  icon,
  severity = 'error',
  onRetry,
  isRetrying = false,
  tips,
  className = '',
}: PanelErrorProps) {
  const config = severityConfig[severity];
  const displayIcon = icon || config.icon;

  return (
    <div
      className={`rounded-2xl p-6 animate-fade-in ${className}`}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${config.color}22` }}
        >
          <Icon name={displayIcon} size={24} color={config.color} decorative />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="text-lg font-semibold mb-1"
            style={{ color: config.color }}
          >
            {title}
          </h3>
          <p
            className="text-sm mb-4"
            style={{ color: 'var(--md-on-surface-variant)' }}
          >
            {message}
          </p>

          {/* Tips */}
          {tips && tips.length > 0 && (
            <div
              className="rounded-lg p-3 mb-4"
              style={{ background: 'var(--md-surface-container)' }}
            >
              <p
                className="text-xs font-semibold mb-2 flex items-center gap-1.5"
                style={{ color: 'var(--md-on-surface-variant)' }}
              >
                <Icon name="lightbulb" size={14} decorative />
                Troubleshooting Tips
              </p>
              <ul className="space-y-1">
                {tips.map((tip, index) => (
                  <li
                    key={index}
                    className="text-xs flex items-start gap-2"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                  >
                    <span style={{ color: config.color }}>•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Retry button */}
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50 flex items-center gap-2"
              style={{
                background: config.color,
                color: 'white',
              }}
            >
              <Icon
                name={isRetrying ? 'refresh' : 'refresh'}
                size={16}
                className={isRetrying ? 'animate-spin' : ''}
                decorative
              />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface PanelEmptyProps {
  /** Icon to display */
  icon?: string;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button text */
  actionText?: string;
  /** Action callback */
  onAction?: () => void;
  /** Custom className */
  className?: string;
}

/**
 * Reusable empty state for dashboard panels
 * Shows when there's no data to display (but no error)
 */
export function PanelEmpty({
  icon = 'inbox',
  title,
  description,
  actionText,
  onAction,
  className = '',
}: PanelEmptyProps) {
  return (
    <div className={`py-12 text-center animate-fade-in ${className}`}>
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: 'var(--md-surface-container-highest)' }}
      >
        <Icon name={icon} size={32} color="var(--md-on-surface-variant)" decorative />
      </div>
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: 'var(--md-on-surface)' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-sm mb-4"
          style={{ color: 'var(--md-on-surface-variant)' }}
        >
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:shadow-md"
          style={{
            background: 'var(--md-primary)',
            color: 'var(--md-on-primary)',
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

/**
 * Helper function to generate user-friendly error messages
 * based on error codes or technical error messages
 */
export function getErrorMessage(error: string | Error | unknown): {
  title: string;
  message: string;
  tips: string[];
  severity: ErrorSeverity;
} {
  const errorString = error instanceof Error ? error.message : String(error);
  const lowerError = errorString.toLowerCase();

  // Network errors
  if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('econnrefused')) {
    return {
      title: 'Connection Failed',
      message: 'Unable to connect to the service. Please check your internet connection and try again.',
      tips: [
        'Check your internet connection',
        'The service might be temporarily unavailable',
        'Try refreshing the page',
      ],
      severity: 'error',
    };
  }

  // Authentication errors
  if (lowerError.includes('401') || lowerError.includes('unauthorized') || lowerError.includes('authentication')) {
    return {
      title: 'Authentication Error',
      message: 'Your session may have expired or credentials are invalid.',
      tips: [
        'Check that your API key is correct',
        'Verify environment variables are set properly',
        'Try re-authenticating with the service',
      ],
      severity: 'error',
    };
  }

  // Permission errors
  if (lowerError.includes('403') || lowerError.includes('forbidden') || lowerError.includes('permission')) {
    return {
      title: 'Access Denied',
      message: "You don't have permission to access this resource.",
      tips: [
        'Verify your account has the required permissions',
        'Contact your administrator for access',
        'Check API key scopes and permissions',
      ],
      severity: 'warning',
    };
  }

  // Not found errors
  if (lowerError.includes('404') || lowerError.includes('not found')) {
    return {
      title: 'Resource Not Found',
      message: 'The requested resource could not be found.',
      tips: [
        'Check that the resource ID or URL is correct',
        'The resource may have been deleted or moved',
        'Verify your configuration settings',
      ],
      severity: 'warning',
    };
  }

  // Rate limiting
  if (lowerError.includes('429') || lowerError.includes('rate limit') || lowerError.includes('too many')) {
    return {
      title: 'Rate Limited',
      message: 'Too many requests. Please wait a moment before trying again.',
      tips: [
        'Wait a few minutes before retrying',
        'Reduce the frequency of requests',
        'Check your API usage limits',
      ],
      severity: 'warning',
    };
  }

  // Timeout errors
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete.',
      tips: [
        'The service might be under heavy load',
        'Try again in a few moments',
        'Check if the service is experiencing issues',
      ],
      severity: 'warning',
    };
  }

  // Server errors
  if (lowerError.includes('500') || lowerError.includes('502') || lowerError.includes('503') || lowerError.includes('server error')) {
    return {
      title: 'Service Unavailable',
      message: 'The service is temporarily unavailable. This is usually a temporary issue.',
      tips: [
        'Wait a few minutes and try again',
        'Check the service status page',
        "This isn't something you can fix - the service needs to recover",
      ],
      severity: 'error',
    };
  }

  // Configuration errors
  if (lowerError.includes('config') || lowerError.includes('environment') || lowerError.includes('api key') || lowerError.includes('missing')) {
    return {
      title: 'Configuration Required',
      message: 'This integration requires additional configuration to work.',
      tips: [
        'Check that all required environment variables are set',
        'Review the .env.local file for missing values',
        'Consult the documentation for setup instructions',
      ],
      severity: 'info',
    };
  }

  // Default error
  return {
    title: 'Something Went Wrong',
    message: errorString || 'An unexpected error occurred. Please try again.',
    tips: [
      'Try refreshing the page',
      'Check the browser console for more details',
      'If the problem persists, contact support',
    ],
    severity: 'error',
  };
}
