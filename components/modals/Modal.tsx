'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../ui/Icon';
import { Button } from '../form/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  contentClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  contentClassName = ''
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const firstFocusableElementRef = useRef<HTMLElement | null>(null);
  const lastFocusableElementRef = useRef<HTMLElement | null>(null);

  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-none w-full h-full'
  };

  // Focus management
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    return Array.from(modalRef.current.querySelectorAll(focusableSelectors)) as HTMLElement[];
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

  // Handle escape key
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

    // Focus the modal after a brief delay to ensure it's rendered
    const timeoutId = setTimeout(() => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else if (modalRef.current) {
        modalRef.current.focus();
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

  // Prevent body scroll when modal is open
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

  const modalContent = (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-surface-scrim/60 backdrop-blur-sm
        ${className}
      `}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={`
          relative bg-surface-container-high rounded-xl shadow-lg
          border border-outline-variant
          max-h-[90vh] overflow-hidden
          ${size === 'full' ? 'w-full h-full rounded-none' : sizeClasses[size]}
          ${contentClassName}
        `}
        tabIndex={-1}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-outline-variant">
            {title && (
              <h2
                id="modal-title"
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
                aria-label="Close modal"
                className="ml-4"
              >
                <Icon name="close" size="sm" decorative={false} />
              </Button>
            )}
          </div>
        )}

        <div className={`
          ${size === 'full' ? 'flex-1 overflow-auto' : 'max-h-[calc(90vh-120px)] overflow-auto'}
        `}>
          {children}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document root
  return typeof window !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}