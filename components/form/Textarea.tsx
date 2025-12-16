'use client';

import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'outlined' | 'filled';
  error?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    variant = 'outlined',
    error = false,
    disabled = false,
    resize = 'vertical',
    className = '',
    ...props
  }, ref) => {
    const baseClasses = `
      w-full rounded-md transition-all duration-200 ease-standard
      font-body-medium placeholder:text-surface-on-surface/60
      focus:outline-none focus:ring-2 focus:ring-primary-main/20
      disabled:opacity-38 disabled:cursor-not-allowed
      min-h-[80px] p-3
    `;

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    };

    const variantClasses = {
      outlined: `
        border border-outline
        bg-surface-default
        hover:border-outline-variant
        focus:border-primary-main
        ${error ? 'border-error-main focus:border-error-main focus:ring-error-main/20' : ''}
      `,
      filled: `
        border-0 border-b-2 border-outline
        bg-surface-container-highest
        hover:bg-surface-container-high
        focus:border-primary-main focus:bg-surface-container-high
        rounded-b-none
        ${error ? 'border-error-main focus:border-error-main focus:ring-error-main/20' : ''}
      `
    };

    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${resizeClasses[resize]}
          ${className}
        `}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';