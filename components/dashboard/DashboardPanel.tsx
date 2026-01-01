'use client';

import React, { ReactNode } from 'react';

export interface DashboardPanelProps {
  id: string;
  title: string;
  icon: ReactNode;
  iconBackground: string;
  iconShadow?: string;
  children: ReactNode;
  isMaximized?: boolean;
  onMaximize?: () => void;
  onMinimize?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  badge?: number | string;
  className?: string;
  headerActions?: ReactNode; // Custom actions to render in header (e.g., Create button)
}

export default function DashboardPanel({
  id,
  title,
  icon,
  iconBackground,
  iconShadow,
  children,
  isMaximized = false,
  onMaximize,
  onMinimize,
  onRefresh,
  isLoading = false,
  badge,
  className = '',
  headerActions,
}: DashboardPanelProps) {
  return (
    <div
      data-panel-id={id}
      data-maximized={isMaximized}
      className={`
        flex flex-col
        rounded-2xl
        bg-[var(--md-surface-container)]
        border border-[var(--md-outline-variant)]
        transition-all duration-300
        ${isMaximized ? 'col-span-2 row-span-3' : ''}
        ${className}
      `}
      style={{
        boxShadow: '0 4px 16px color-mix(in srgb, var(--md-shadow) 20%, transparent)',
        height: isMaximized ? '100%' : undefined,
      }}
    >
      {/* Panel Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--md-outline-variant)]">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: iconBackground,
              boxShadow: iconShadow || `0 4px 12px color-mix(in srgb, ${iconBackground} 40%, transparent)`,
            }}
          >
            {icon}
          </div>

          {/* Title & Badge */}
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[var(--md-on-surface)]">
              {title}
            </h3>
            {badge !== undefined && (
              <span
                className="min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium flex items-center justify-center bg-[var(--md-error)] text-[var(--md-on-error)]"
              >
                {typeof badge === 'number' && badge > 99 ? '99+' : badge}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Custom Header Actions (e.g., Create button) */}
          {headerActions}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg transition-all hover:bg-[var(--md-surface-container-high)] disabled:opacity-50 active:scale-95"
              title="Refresh"
            >
              <svg
                className={`w-4 h-4 text-[var(--md-on-surface-variant)] ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}

          {/* Maximize/Minimize Button */}
          {isMaximized ? (
            <button
              onClick={onMinimize}
              className="p-2 rounded-lg transition-all hover:bg-[var(--md-surface-container-high)] active:scale-95"
              title="Restore"
            >
              <svg
                className="w-4 h-4 text-[var(--md-on-surface-variant)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                />
              </svg>
            </button>
          ) : (
            <button
              onClick={onMaximize}
              className="p-2 rounded-lg transition-all hover:bg-[var(--md-surface-container-high)] active:scale-95"
              title="Maximize"
            >
              <svg
                className="w-4 h-4 text-[var(--md-on-surface-variant)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 min-h-0 overflow-hidden p-4 flex flex-col">
        {children}
      </div>
    </div>
  );
}
