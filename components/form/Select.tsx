'use client';

import React, { forwardRef, useState } from 'react';
import Icon from '../ui/Icon';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  variant?: 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    options,
    variant = 'outlined',
    size = 'md',
    error = false,
    disabled = false,
    placeholder,
    className = '',
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const baseClasses = `
      w-full rounded-md transition-all duration-200 ease-standard
      font-body-medium appearance-none cursor-pointer
      focus:outline-none focus:ring-2 focus:ring-primary-main/20
      disabled:opacity-38 disabled:cursor-not-allowed
      bg-surface-default
    `;

    const sizeClasses = {
      sm: 'h-8 text-sm px-3 pr-8',
      md: 'h-10 text-sm px-3 pr-10',
      lg: 'h-12 text-base px-4 pr-12'
    };

    const variantClasses = {
      outlined: `
        border border-outline
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
      <div className="relative">
        <select
          ref={ref}
          disabled={disabled}
          className={`
            ${baseClasses}
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            ${className}
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="bg-surface-default text-surface-on-surface"
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className={`
          absolute right-0 top-0 h-full flex items-center justify-center pointer-events-none
          ${size === 'sm' ? 'w-8' : size === 'md' ? 'w-10' : 'w-12'}
        `}>
          <Icon
            name={isFocused ? "expand_less" : "expand_more"}
            size={size === 'sm' ? 'xs' : 'sm'}
            className={`
              transition-transform duration-200
              ${error ? 'text-error-main' : 'text-surface-on-surface/60'}
            `}
            decorative
          />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';