"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { type ReactNode } from "react"

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider
      // Disable automatic session polling - only fetch on mount and when explicitly needed
      // This prevents the repeated /api/auth/session calls seen in logs
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  )
}
