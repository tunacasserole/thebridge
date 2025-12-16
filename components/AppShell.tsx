"use client"

import { useSession } from "next-auth/react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { SkipLinks } from "@/components/accessibility"

interface AppShellProps {
  children: React.ReactNode
}

/**
 * AppShell - Conditional layout wrapper
 * Shows header/footer only for authenticated users
 * Logged-out users see the landing page with its own navigation
 */
export function AppShell({ children }: AppShellProps) {
  const { data: session, status } = useSession()
  const isAuthenticated = !!session
  const isLoading = status === "loading"

  // During loading, show minimal shell to prevent flash
  if (isLoading) {
    return (
      <>
        <main
          id="main-content"
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
          role="main"
        >
          {children}
        </main>
      </>
    )
  }

  // For logged-out users, render children directly (landing page has its own nav)
  if (!isAuthenticated) {
    return (
      <main
        id="main-content"
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
        role="main"
      >
        {children}
      </main>
    )
  }

  // For authenticated users, show full app chrome
  return (
    <>
      <SkipLinks />
      <Header />
      <main
        id="main-content"
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
        role="main"
      >
        {children}
      </main>
      <Footer />
    </>
  )
}
