'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from '../form/Button';
import Icon from '../ui/Icon';

type AlertType = 'info' | 'warning' | 'error' | 'success' | 'confirm';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  type?: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
  loading?: boolean;
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancelButton = false,
  loading = false
}: AlertDialogProps) {
  const iconMap = {
    info: { name: 'info', color: 'text-primary-main' },
    warning: { name: 'warning', color: 'text-warning-main' },
    error: { name: 'error', color: 'text-error-main' },
    success: { name: 'check_circle', color: 'text-success-main' },
    confirm: { name: 'help', color: 'text-tertiary-main' }
  };

  const buttonColorMap = {
    info: 'primary',
    warning: 'warning',
    error: 'error',
    success: 'success',
    confirm: 'primary'
  } as const;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const icon = iconMap[type];
  const buttonColor = buttonColorMap[type];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnBackdropClick={false}
      closeOnEscape={!loading}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <Icon
              name={icon.name}
              size="md"
              className={icon.color}
              decorative={false}
              aria-label={type}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-surface-on-surface mb-2">
              {title}
            </h3>
            <p className="text-sm text-surface-on-surface/70 whitespace-pre-wrap">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          {showCancelButton && (
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
          )}

          <Button
            variant="filled"
            color={buttonColor}
            onClick={handleConfirm}
            loading={loading}
            autoFocus
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}