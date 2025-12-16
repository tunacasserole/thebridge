'use client';

/**
 * Role Switcher Component
 *
 * Displays current role and allows switching between roles.
 * Shown in the header bar for easy access.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRole } from '@/contexts/RoleContext';
import { ROLE_DEFINITIONS, getAllRoles } from '@/data/roles';
import { colors } from '@/lib/colors';
import type { UserRole } from '@/types/roles';

interface RoleSwitcherProps {
  variant?: 'button' | 'chip';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

// Simple emoji icons matching RoleBadge
const ROLE_ICONS: Record<UserRole, string> = {
  sre: '⚡', // Speed/Lightning
  pm: '📋', // Clipboard/Planning
};

const sizeStyles = {
  small: { fontSize: '12px', padding: '4px 8px', iconSize: '14px' },
  medium: { fontSize: '14px', padding: '8px 12px', iconSize: '16px' },
  large: { fontSize: '16px', padding: '10px 16px', iconSize: '18px' },
};

export default function RoleSwitcher({
  variant = 'button',
  size = 'medium',
  showLabel = true,
}: RoleSwitcherProps) {
  const { currentRole, roleDefinition, switchRole, isHydrated } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const style = sizeStyles[size];

  // Show placeholder until hydrated to avoid hydration mismatch
  // (server renders with DEFAULT_ROLE, client may have different role in localStorage)
  if (!isHydrated) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: style.padding,
            borderRadius: '16px',
            background: 'var(--md-surface-container, #1a1a1a)',
            color: 'var(--md-on-surface-variant, #888)',
            fontWeight: 600,
            fontSize: style.fontSize,
            minWidth: '60px',
            height: size === 'small' ? '26px' : size === 'large' ? '38px' : '32px',
          }}
        >
          {/* Skeleton placeholder */}
        </div>
      </div>
    );
  }

  if (variant === 'chip') {
    return (
      <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: style.padding,
            borderRadius: '16px',
            border: 'none',
            background: `${roleDefinition.color}1A`, // 10% opacity
            color: roleDefinition.color,
            fontWeight: 600,
            fontSize: style.fontSize,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${roleDefinition.color}33`; // 20% opacity
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${roleDefinition.color}1A`; // 10% opacity
          }}
        >
          <span style={{ fontSize: style.iconSize }}>{ROLE_ICONS[currentRole]}</span>
          {showLabel && roleDefinition.shortName}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <RoleMenu
          isOpen={isOpen}
          currentRole={currentRole}
          onRoleSelect={handleRoleSelect}
        />
      </div>
    );
  }

  // Button variant - Avatar style
  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={`Switch from ${roleDefinition.name}`}
        style={{
          position: 'relative',
          width: size === 'small' ? '32px' : size === 'large' ? '48px' : '40px',
          height: size === 'small' ? '32px' : size === 'large' ? '48px' : '40px',
          borderRadius: '50%',
          border: `3px solid ${roleDefinition.color}`,
          background: `linear-gradient(135deg, ${roleDefinition.color}15, ${roleDefinition.color}25)`,
          color: roleDefinition.color,
          fontWeight: 700,
          fontSize: size === 'small' ? '11px' : size === 'large' ? '16px' : '13px',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 8px ${roleDefinition.color}40`,
          overflow: 'visible',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
          e.currentTarget.style.boxShadow = `0 4px 16px ${roleDefinition.color}60`;
          e.currentTarget.style.borderWidth = '4px';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          e.currentTarget.style.boxShadow = `0 2px 8px ${roleDefinition.color}40`;
          e.currentTarget.style.borderWidth = '3px';
        }}
      >
        {/* Initials */}
        <span style={{ position: 'relative', zIndex: 2 }}>
          {roleDefinition.shortName}
        </span>

        {/* Decorative ring animation */}
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            right: '-4px',
            bottom: '-4px',
            borderRadius: '50%',
            border: `2px solid ${roleDefinition.color}`,
            opacity: 0.3,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      </button>
      <RoleMenu
        isOpen={isOpen}
        currentRole={currentRole}
        onRoleSelect={handleRoleSelect}
      />

      {/* Add keyframes for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

interface RoleMenuProps {
  isOpen: boolean;
  currentRole: UserRole;
  onRoleSelect: (role: UserRole) => void;
}

function RoleMenu({ isOpen, currentRole, onRoleSelect }: RoleMenuProps) {
  const roles = getAllRoles();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        right: 0,
        minWidth: '280px',
        background: colors.surfaceContainer,
        border: `1px solid ${colors.outline}`,
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.outline}` }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: colors.onSurfaceVariant,
            letterSpacing: '0.5px',
          }}
        >
          SWITCH ROLE
        </div>
      </div>
      <div style={{ padding: '8px' }}>
        {roles.map((role) => {
          const definition = ROLE_DEFINITIONS[role];
          const isActive = role === currentRole;

          return (
            <button
              key={role}
              onClick={() => onRoleSelect(role)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                background: isActive ? `${definition.color}1A` : 'transparent',
                color: colors.onSurface,
                cursor: 'pointer',
                marginBottom: '4px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = colors.surfaceContainerHighest;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div
                style={{
                  fontSize: '20px',
                  color: definition.color,
                  minWidth: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {ROLE_ICONS[role]}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? definition.color : colors.onSurface,
                    marginBottom: '2px',
                  }}
                >
                  {definition.name}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: colors.onSurfaceVariant,
                  }}
                >
                  {definition.description}
                </div>
              </div>
              {isActive && (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  style={{ color: definition.color }}
                >
                  <path
                    d="M16.25 5.625L7.5 14.375L3.75 10.625"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
