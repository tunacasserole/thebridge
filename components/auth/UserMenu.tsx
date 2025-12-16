"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Icon from "@/components/ui/Icon"

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
          className="absolute right-0 mt-2 w-56 rounded-lg
            bg-md-surface-container border border-md-outline-variant
            shadow-lg overflow-hidden z-50"
          role="menu"
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-md-outline-variant">
            <p className="text-sm font-medium text-md-on-surface truncate">
              {session.user?.name || "User"}
            </p>
            <p className="text-xs text-md-on-surface-variant truncate">
              {session.user?.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <a
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-md-on-surface
                hover:bg-md-surface-container-high transition-colors"
              role="menuitem"
            >
              <Icon name="settings" size={18} />
              Settings
            </a>
            <a
              href="/settings/api-keys"
              className="flex items-center gap-3 px-4 py-2 text-sm text-md-on-surface
                hover:bg-md-surface-container-high transition-colors"
              role="menuitem"
            >
              <Icon name="key" size={18} />
              API Keys
            </a>
          </div>

          {/* Sign Out */}
          <div className="border-t border-md-outline-variant py-1">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-md-error
                hover:bg-md-error-container/30 transition-colors"
              role="menuitem"
            >
              <Icon name="logout" size={18} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
