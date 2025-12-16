'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../ui/Icon';
import { Button } from '../form/Button';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export function SidePanel({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = ''
}: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Size classes
  const sizeClasses = {
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-[32rem]',
    xl: 'w-[40rem]'
  };

  // Animation classes based on side
  const animationClasses = {
    left: {
      enter: 'translate-x-0',
      exit: '-translate-x-full'
    },
    right: {
      enter: 'translate-x-0',
      exit: 'translate-x-full'
    }
  };

  // Focus management
  const getFocusableElements = useCallback(() => {
    if (!panelRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    return Array.from(panelRef.current.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }, []);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, [getFocusableElements]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose();
    }
    if (e.key === 'Tab') {
      trapFocus(e);
    }
  }, [closeOnEscape, onClose, trapFocus]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  // Setup focus management and event listeners
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);

    // Focus the panel after a brief delay
    const timeoutId = setTimeout(() => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else if (panelRef.current) {
        panelRef.current.focus();
      }
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);

      // Restore focus to the previously active element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown, getFocusableElements]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const panelContent = (
    <div
      className="fixed inset-0 z-50 flex"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'panel-title' : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-surface-scrim/60 backdrop-blur-sm" />

      {/* Panel */}
      <div className={`
        relative flex h-full
        ${side === 'right' ? 'ml-auto' : 'mr-auto'}
      `}>
        <div
          ref={panelRef}
          className={`
            h-full bg-surface-container-high shadow-xl
            border-l border-outline-variant
            flex flex-col
            transition-transform duration-300 ease-emphasized
            ${sizeClasses[size]}
            ${isOpen ? animationClasses[side].enter : animationClasses[side].exit}
            ${side === 'left' ? 'border-l-0 border-r' : ''}
            ${className}
          `}
          tabIndex={-1}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-outline-variant flex-shrink-0">
              {title && (
                <h2
                  id="panel-title"
                  className="text-lg font-semibold text-surface-on-surface"
                >
                  {title}
                </h2>
              )}

              {showCloseButton && (
                <Button
                  variant="text"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close panel"
                  className="ml-4"
                >
                  <Icon name="close" size="sm" decorative={false} />
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render panel at document root
  return typeof window !== 'undefined'
    ? createPortal(panelContent, document.body)
    : null;
}