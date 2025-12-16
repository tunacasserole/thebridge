'use client';

import React, { forwardRef } from 'react';
import Icon from '../ui/Icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text' | 'tonal';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'warning';
  startIcon?: string;
  endIcon?: string;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'filled',
    size = 'md',
    color = 'primary',
    startIcon,
    endIcon,
    loading = false,
    disabled = false,
    fullWidth = false,
    className = '',
    children,
    ...props
  }, ref) => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2 rounded-full
      font-label-large font-medium transition-all duration-200 ease-standard
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-38 disabled:cursor-not-allowed disabled:pointer-events-none
      ${fullWidth ? 'w-full' : ''}
    `;

    const sizeClasses = {
      sm: 'h-8 px-4 text-sm min-w-[64px]',
      md: 'h-10 px-6 text-sm min-w-[64px]',
      lg: 'h-12 px-8 text-base min-w-[80px]'
    };

    type ColorKey = 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'warning';
    type VariantKey = 'filled' | 'outlined' | 'text' | 'tonal';

    const getColorClasses = (variant: VariantKey, color: ColorKey) => {
      const colorMap: Record<ColorKey, Record<VariantKey, string>> = {
        primary: {
          filled: 'bg-primary-main text-primary-on-main hover:bg-primary-main/90 focus:ring-primary-main/20',
          outlined: 'border border-primary-main text-primary-main bg-transparent hover:bg-primary-main/8 focus:ring-primary-main/20',
          text: 'text-primary-main bg-transparent hover:bg-primary-main/8 focus:ring-primary-main/20',
          tonal: 'bg-primary-container text-primary-on-container hover:bg-primary-container/80 focus:ring-primary-main/20'
        },
        secondary: {
          filled: 'bg-secondary-main text-secondary-on-main hover:bg-secondary-main/90 focus:ring-secondary-main/20',
          outlined: 'border border-secondary-main text-secondary-main bg-transparent hover:bg-secondary-main/8 focus:ring-secondary-main/20',
          text: 'text-secondary-main bg-transparent hover:bg-secondary-main/8 focus:ring-secondary-main/20',
          tonal: 'bg-secondary-container text-secondary-on-container hover:bg-secondary-container/80 focus:ring-secondary-main/20'
        },
        error: {
          filled: 'bg-error-main text-error-on-main hover:bg-error-main/90 focus:ring-error-main/20',
          outlined: 'border border-error-main text-error-main bg-transparent hover:bg-error-main/8 focus:ring-error-main/20',
          text: 'text-error-main bg-transparent hover:bg-error-main/8 focus:ring-error-main/20',
          tonal: 'bg-error-container text-error-on-container hover:bg-error-container/80 focus:ring-error-main/20'
        },
        success: {
          filled: 'bg-success-main text-success-on-main hover:bg-success-main/90 focus:ring-success-main/20',
          outlined: 'border border-success-main text-success-main bg-transparent hover:bg-success-main/8 focus:ring-success-main/20',
          text: 'text-success-main bg-transparent hover:bg-success-main/8 focus:ring-success-main/20',
          tonal: 'bg-success-container text-success-on-container hover:bg-success-container/80 focus:ring-success-main/20'
        },
        warning: {
          filled: 'bg-warning-main text-warning-on-main hover:bg-warning-main/90 focus:ring-warning-main/20',
          outlined: 'border border-warning-main text-warning-main bg-transparent hover:bg-warning-main/8 focus:ring-warning-main/20',
          text: 'text-warning-main bg-transparent hover:bg-warning-main/8 focus:ring-warning-main/20',
          tonal: 'bg-warning-container text-warning-on-container hover:bg-warning-container/80 focus:ring-warning-main/20'
        },
        tertiary: {
          filled: 'bg-tertiary-main text-tertiary-on-main hover:bg-tertiary-main/90 focus:ring-tertiary-main/20',
          outlined: 'border border-tertiary-main text-tertiary-main bg-transparent hover:bg-tertiary-main/8 focus:ring-tertiary-main/20',
          text: 'text-tertiary-main bg-transparent hover:bg-tertiary-main/8 focus:ring-tertiary-main/20',
          tonal: 'bg-tertiary-container text-tertiary-on-container hover:bg-tertiary-container/80 focus:ring-tertiary-main/20'
        }
      };

      return colorMap[color]?.[variant] || colorMap.primary[variant];
    };

    const iconSize = size === 'sm' ? 'xs' : 'sm';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          ${baseClasses}
          ${sizeClasses[size]}
          ${getColorClasses(variant, color)}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <>
            <div className="animate-spin">
              <Icon
                name="progress_activity"
                size={iconSize}
                decorative
              />
            </div>
            {children && <span className="opacity-60">Loading...</span>}
          </>
        ) : (
          <>
            {startIcon && (
              <Icon
                name={startIcon}
                size={iconSize}
                decorative
              />
            )}
            {children}
            {endIcon && (
              <Icon
                name={endIcon}
                size={iconSize}
                decorative
              />
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';