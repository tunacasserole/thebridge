'use client';

import { CSSProperties } from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
export type IconVariant = 'outlined' | 'filled';

interface IconProps {
  /**
   * Material Symbol name (e.g., 'refresh', 'warning', 'check_circle')
   * See: https://fonts.google.com/icons
   */
  name: string;

  /**
   * Icon size: 'xs' (16px), 'sm' (20px), 'md' (24px), 'lg' (32px), 'xl' (48px), or custom number
   */
  size?: IconSize;

  /**
   * Icon variant: 'outlined' (default) or 'filled'
   */
  variant?: IconVariant;

  /**
   * Icon color - can be any CSS color value
   */
  color?: string;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Inline styles
   */
  style?: CSSProperties;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;

  /**
   * Whether the icon is decorative (hidden from screen readers)
   */
  decorative?: boolean;

  /**
   * Animation class (e.g., 'animate-spin')
   */
  animate?: string;

  /**
   * Click handler
   */
  onClick?: () => void;
}

export default function Icon({
  name,
  size = 'md',
  variant = 'outlined',
  color,
  className = '',
  style,
  ariaLabel,
  decorative = false,
  animate,
  onClick,
}: IconProps) {
  // Convert size to CSS
  const getSizeClass = () => {
    if (typeof size === 'number') {
      return '';
    }
    return `material-icon-${size}`;
  };

  const getSizeStyle = () => {
    if (typeof size === 'number') {
      return { fontSize: `${size}px` };
    }
    return {};
  };

  const variantClass = variant === 'filled' ? 'material-symbols-filled' : 'material-symbols-outlined';

  const combinedClassName = [
    variantClass,
    getSizeClass(),
    animate,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const combinedStyle: CSSProperties = {
    ...getSizeStyle(),
    ...(color && { color }),
    ...style,
    ...(onClick && { cursor: 'pointer' }),
  };

  return (
    <span
      className={combinedClassName}
      style={combinedStyle}
      aria-label={decorative ? undefined : ariaLabel}
      aria-hidden={decorative}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {name}
    </span>
  );
}

/**
 * Commonly used icon mappings from lucide-react to Material Symbols
 */
export const iconMap = {
  // Status & Alerts
  'alert-triangle': 'warning',
  'alert-circle': 'error',
  'check-circle': 'check_circle',
  'check-circle-2': 'check_circle',
  'x-circle': 'cancel',
  'info': 'info',
  'help-circle': 'help',

  // Actions & Controls
  'refresh-cw': 'refresh',
  'refresh': 'refresh',
  'plus': 'add',
  'minus': 'remove',
  'x': 'close',
  'send': 'send',
  'save': 'save',
  'download': 'download',
  'upload': 'upload',
  'copy': 'content_copy',
  'trash': 'delete',
  'edit': 'edit',
  'search': 'search',

  // Navigation
  'chevron-down': 'keyboard_arrow_down',
  'chevron-up': 'keyboard_arrow_up',
  'chevron-left': 'keyboard_arrow_left',
  'chevron-right': 'keyboard_arrow_right',
  'arrow-left': 'arrow_back',
  'arrow-right': 'arrow_forward',
  'arrow-up': 'arrow_upward',
  'arrow-down': 'arrow_downward',
  'external-link': 'open_in_new',
  'menu': 'menu',

  // Time & Monitoring
  'clock': 'schedule',
  'activity': 'monitoring',
  'trending-up': 'trending_up',
  'trending-down': 'trending_down',
  'loader': 'progress_activity',
  'loader-2': 'progress_activity',

  // Communication
  'bell': 'notifications',
  'message-square': 'chat',
  'message-circle': 'chat_bubble',
  'mail': 'mail',
  'sparkles': 'auto_awesome',

  // Git & Version Control
  'git-branch': 'account_tree',
  'git-commit': 'commit',
  'git-pull-request': 'merge',
  'git-fork': 'fork_right',

  // Data & Documents
  'database': 'database',
  'file-text': 'description',
  'folder': 'folder',
  'file': 'draft',
  'bar-chart-3': 'bar_chart',
  'layout': 'dashboard',

  // User & Security
  'user': 'person',
  'users': 'group',
  'shield': 'shield',
  'shield-alert': 'gpp_maybe',
  'lock': 'lock',
  'unlock': 'lock_open',

  // Network & Connectivity
  'wifi': 'wifi',
  'wifi-off': 'wifi_off',
  'globe': 'public',
  'cloud': 'cloud',
  'server': 'dns',

  // Special
  'rocket': 'rocket_launch',
  'target': 'target',
  'star': 'star',
  'dollar-sign': 'attach_money',
  'hard-drive': 'storage',
  'maximize-2': 'fullscreen',
  'minimize-2': 'fullscreen_exit',
};
