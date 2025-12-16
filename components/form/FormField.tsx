'use client';

import React from 'react';
import Icon from '../ui/Icon';

interface FormFieldProps {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function FormField({
  label,
  id,
  required = false,
  error,
  hint,
  children,
  disabled = false
}: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="form-field space-y-2">
      <label
        htmlFor={id}
        className={`
          block text-sm font-medium
          ${disabled
            ? 'text-surface-on-surface/38'
            : 'text-surface-on-surface'
          }
        `}
      >
        {label}
        {required && (
          <span
            className="text-error-main ml-1"
            aria-label="required"
          >
            *
          </span>
        )}
      </label>

      <div className="relative">
        {React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          id,
          'aria-describedby': describedBy,
          'aria-invalid': error ? 'true' : undefined,
          disabled,
        })}
      </div>

      {hint && !error && (
        <p
          id={hintId}
          className="text-xs text-surface-on-surface/60"
        >
          {hint}
        </p>
      )}

      {error && (
        <div
          id={errorId}
          className="flex items-center gap-1 text-xs text-error-main"
          role="alert"
        >
          <Icon
            name="error"
            size="xs"
            className="text-error-main flex-shrink-0"
            decorative={false}
            aria-label="Error"
          />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}