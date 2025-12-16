"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Icon from "@/components/ui/Icon"
import { colors } from "@/lib/colors"

export function UserMenu() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Loading state
  if (status === "loading") {
    return (
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-md-surface-container animate-pulse" />
    )
  }

  // Not signed in
  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-md-primary text-md-on-primary text-sm font-medium
          hover:bg-md-primary/90 active:scale-95
          transition-all duration-150"
      >
        <Icon name="login" size={18} />
        <span className="hidden sm:inline">Sign In</span>
      </button>
    )
  }

  // Signed in - show user menu
  const initials = session.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
          shadow-md transition-transform hover:scale-105 active:scale-95
          focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary
          focus-visible:ring-offset-2 focus-visible:ring-offset-md-surface overflow-hidden"
        style={{
          background: session.user?.image
            ? "transparent"
            : "linear-gradient(135deg, var(--md-accent), var(--md-accent-dark))",
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || "User avatar"}
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs sm:text-sm font-semibold text-md-on-primary">
            {initials}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
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
          role="menu"
        >
          {/* User Info Header */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.outline}` }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: colors.onSurfaceVariant,
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              ACCOUNT
            </div>
            <p style={{ fontSize: '14px', fontWeight: 500, color: colors.onSurface, margin: 0 }}>
              {session.user?.name || "User"}
            </p>
            <p style={{ fontSize: '11px', color: colors.onSurfaceVariant, margin: 0 }}>
              {session.user?.email}
            </p>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '8px' }}>
            <MenuItem href="/settings" icon="settings" label="Settings" />
            <MenuItem href="/settings/api-keys" icon="key" label="API Keys" />
          </div>

          {/* Sign Out */}
          <div style={{ padding: '8px', borderTop: `1px solid ${colors.outline}` }}>
            <button
              onClick={() => signOut()}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                background: 'transparent',
                color: colors.error,
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              role="menuitem"
            >
              <Icon name="logout" size={20} style={{ color: colors.error }} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  href: string;
  icon: string;
  label: string;
}

function MenuItem({ href, icon, label }: MenuItemProps) {
  return (
    <a
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        background: 'transparent',
        color: colors.onSurface,
        textDecoration: 'none',
        marginBottom: '4px',
        transition: 'background 0.2s',
        fontSize: '14px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = colors.surfaceContainerHighest;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
      role="menuitem"
    >
      <Icon name={icon} size={20} style={{ color: colors.onSurfaceVariant }} />
      {label}
    </a>
  );
}
