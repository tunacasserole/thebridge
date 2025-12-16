'use client';

import React, { forwardRef } from 'react';
import Icon from '../ui/Icon';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  startIcon?: string;
  endIcon?: string;
  error?: boolean;
  loading?: boolean;
  onClearClick?: () => void;
  showClearButton?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    variant = 'outlined',
    size = 'md',
    startIcon,
    endIcon,
    error = false,
    loading = false,
    disabled = false,
    className = '',
    onClearClick,
    showClearButton = false,
    value,
    ...props
  }, ref) => {
    const baseClasses = `
      w-full rounded-md transition-all duration-200 ease-standard
      font-body-medium placeholder:text-surface-on-surface/60
      focus:outline-none focus:ring-2 focus:ring-primary-main/20
      disabled:opacity-38 disabled:cursor-not-allowed
    `;

    const sizeClasses = {
      sm: 'h-8 text-sm px-3',
      md: 'h-10 text-sm px-3',
      lg: 'h-12 text-base px-4'
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

    const hasStartAdornment = startIcon;
    const hasEndAdornment = endIcon || loading || (showClearButton && value);

    const paddingClasses = `
      ${hasStartAdornment ? (size === 'sm' ? 'pl-8' : size === 'md' ? 'pl-10' : 'pl-12') : ''}
      ${hasEndAdornment ? (size === 'sm' ? 'pr-8' : size === 'md' ? 'pr-10' : 'pr-12') : ''}
    `;

    return (
      <div className="relative">
        {startIcon && (
          <div className={`
            absolute left-0 top-0 h-full flex items-center justify-center
            ${size === 'sm' ? 'w-8' : size === 'md' ? 'w-10' : 'w-12'}
            pointer-events-none
          `}>
            <Icon
              name={startIcon}
              size={size === 'sm' ? 'xs' : 'sm'}
              className={`${error ? 'text-error-main' : 'text-surface-on-surface/60'}`}
              decorative
            />
          </div>
        )}

        <input
          ref={ref}
          disabled={disabled}
          value={value}
          className={`
            ${baseClasses}
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            ${paddingClasses}
            ${className}
          `}
          {...props}
        />

        {(endIcon || loading || (showClearButton && value)) && (
          <div className={`
            absolute right-0 top-0 h-full flex items-center justify-center gap-1
            ${size === 'sm' ? 'w-8 pr-2' : size === 'md' ? 'w-10 pr-3' : 'w-12 pr-4'}
          `}>
            {loading && (
              <div className="animate-spin">
                <Icon
                  name="progress_activity"
                  size={size === 'sm' ? 'xs' : 'sm'}
                  className="text-surface-on-surface/60"
                  decorative
                />
              </div>
            )}

            {showClearButton && value && !loading && (
              <button
                type="button"
                onClick={onClearClick}
                className={`
                  p-0.5 rounded-full hover:bg-surface-container-high
                  focus:outline-none focus:bg-surface-container-high
                  transition-colors duration-200
                `}
                aria-label="Clear input"
              >
                <Icon
                  name="close"
                  size="xs"
                  className="text-surface-on-surface/60 hover:text-surface-on-surface"
                  decorative={false}
                />
              </button>
            )}

            {endIcon && !loading && (
              <Icon
                name={endIcon}
                size={size === 'sm' ? 'xs' : 'sm'}
                className={`${error ? 'text-error-main' : 'text-surface-on-surface/60'}`}
                decorative
              />
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';