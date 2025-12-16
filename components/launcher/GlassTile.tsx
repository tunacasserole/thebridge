'use client';

import { ReactNode } from 'react';

export interface GlassTileProps {
  /** Unique identifier for the tile */
  id: string;
  /** Icon to display (React node - SVG, image, or emoji) */
  icon: ReactNode;
  /** Primary title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Whether this tile is currently selected */
  selected?: boolean;
  /** Whether this tile is disabled */
  disabled?: boolean;
  /** Optional status indicator color */
  statusColor?: 'success' | 'warning' | 'error' | 'primary' | 'secondary';
  /** Optional badge text (e.g., "Beta", "New") */
  badge?: string;
  /** Click handler */
  onClick?: (id: string) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
}

const sizeStyles = {
  sm: {
    container: 'p-4 min-w-[120px]',
    icon: 'w-10 h-10 text-2xl',
    title: 'text-sm font-medium',
    description: 'text-xs',
  },
  md: {
    container: 'p-5 min-w-[160px]',
    icon: 'w-14 h-14 text-3xl',
    title: 'text-base font-semibold',
    description: 'text-sm',
  },
  lg: {
    container: 'p-6 min-w-[200px]',
    icon: 'w-16 h-16 text-4xl',
    title: 'text-lg font-bold',
    description: 'text-base',
  },
};

const statusColorMap = {
  success: 'bg-[var(--md-success)]',
  warning: 'bg-[var(--md-warning)]',
  error: 'bg-[var(--md-error)]',
  primary: 'bg-[var(--md-primary)]',
  secondary: 'bg-[var(--md-secondary)]',
};

const badgeColorMap = {
  Beta: 'bg-[var(--md-violet)] text-white',
  New: 'bg-[var(--md-success)] text-[var(--md-on-success)]',
  Pro: 'bg-gradient-to-r from-[var(--md-amber-500)] to-[var(--md-warning)] text-black',
};

export default function GlassTile({
  id,
  icon,
  title,
  description,
  selected = false,
  disabled = false,
  statusColor,
  badge,
  onClick,
  size = 'md',
  className = '',
}: GlassTileProps) {
  const styles = sizeStyles[size];

  return (
    <button
      onClick={() => !disabled && onClick?.(id)}
      disabled={disabled}
      className={`
        glass glass-tile
        ${styles.container}
        rounded-2xl
        flex flex-col items-center justify-center gap-3
        text-center
        cursor-pointer
        relative
        overflow-hidden
        focus:outline-none focus:ring-2 focus:ring-[var(--md-accent)] focus:ring-offset-2 focus:ring-offset-[var(--md-surface)]
        ${selected ? 'glass-tile-selected' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      aria-pressed={selected}
      aria-disabled={disabled}
    >
      {/* Status indicator dot */}
      {statusColor && (
        <span
          className={`
            absolute top-3 right-3
            w-2.5 h-2.5 rounded-full
            ${statusColorMap[statusColor]}
            shadow-lg
          `}
          style={{
            boxShadow: `0 0 8px var(--md-${statusColor})`,
          }}
        />
      )}

      {/* Badge */}
      {badge && (
        <span
          className={`
            absolute top-2 left-2
            px-2 py-0.5 rounded-full
            text-[10px] font-bold uppercase tracking-wide
            ${badgeColorMap[badge as keyof typeof badgeColorMap] || 'bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)]'}
          `}
        >
          {badge}
        </span>
      )}

      {/* Selected checkmark */}
      {selected && (
        <span className="absolute top-3 right-3 text-[var(--md-accent)]">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}

      {/* Icon container with subtle glow on hover */}
      <div
        className={`
          ${styles.icon}
          flex items-center justify-center
          rounded-xl
          bg-gradient-to-br from-[var(--md-surface-container-high)] to-[var(--md-surface-container)]
          transition-all duration-300
          group-hover:scale-110
        `}
        style={{
          boxShadow: selected
            ? '0 4px 20px color-mix(in srgb, var(--md-accent) 30%, transparent)'
            : '0 4px 12px color-mix(in srgb, var(--md-surface) 80%, transparent)',
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <span
        className={`
          ${styles.title}
          text-[var(--md-on-surface)]
          transition-colors duration-200
        `}
      >
        {title}
      </span>

      {/* Description */}
      {description && (
        <span
          className={`
            ${styles.description}
            text-[var(--md-on-surface-variant)]
            line-clamp-2
          `}
        >
          {description}
        </span>
      )}

      {/* Subtle inner highlight for depth */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, white 5%, transparent) 0%, transparent 50%)',
        }}
      />
    </button>
  );
}
