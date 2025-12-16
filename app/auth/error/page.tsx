"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AuthLayout } from "@/components/auth"

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Server Error",
    description: "There is a problem with the server configuration. Please contact support.",
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You do not have permission to sign in.",
  },
  Verification: {
    title: "Verification Error",
    description: "The verification link may have expired or already been used.",
  },
  OAuthSignin: {
    title: "Sign In Error",
    description: "Error in the OAuth sign in process. Please try again.",
  },
  OAuthCallback: {
    title: "Callback Error",
    description: "Error in the OAuth callback. Please try again.",
  },
  OAuthCreateAccount: {
    title: "Account Creation Error",
    description: "Could not create OAuth account. Please try again.",
  },
  EmailCreateAccount: {
    title: "Account Creation Error",
    description: "Could not create email account. Please try again.",
  },
  Callback: {
    title: "Callback Error",
    description: "Error during the callback. Please try again.",
  },
  OAuthAccountNotLinked: {
    title: "Account Already Exists",
    description: "This email is already associated with another account. Please sign in with the original provider.",
  },
  EmailSignin: {
    title: "Email Sign In Error",
    description: "Could not send the sign in email. Please try again.",
  },
  CredentialsSignin: {
    title: "Sign In Failed",
    description: "The credentials you provided are incorrect.",
  },
  SessionRequired: {
    title: "Sign In Required",
    description: "Please sign in to access this page.",
  },
  Default: {
    title: "Authentication Error",
    description: "An error occurred during authentication. Please try again.",
  },
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error") || "Default"
  const { title, description } = errorMessages[error] || errorMessages.Default

  return (
    <div className="text-center">
      {/* Error Icon */}
      <div className="flex justify-center mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'var(--md-error-container)' }}
        >
          <span
            className="material-symbols-outlined text-4xl"
            style={{ color: 'var(--md-error)' }}
          >
            error
          </span>
        </div>
      </div>

      {/* Error Message */}
      <h1
        className="text-2xl font-bold mb-3"
        style={{ color: 'var(--md-on-surface)' }}
      >
        {title}
      </h1>
      <p
        className="text-base mb-8"
        style={{ color: 'var(--md-on-surface-variant)' }}
      >
        {description}
      </p>

      {/* Actions */}
      <div className="space-y-3">
        <Link
          href="/auth/signin"
          className="block w-full px-6 py-4 rounded-xl font-medium
            transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'var(--md-primary)',
            color: 'var(--md-on-primary)',
          }}
        >
          Try Again
        </Link>
        <Link
          href="/"
          className="block w-full px-6 py-4 rounded-xl font-medium
            transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'var(--md-surface-container-high)',
            border: '1px solid var(--md-outline)',
            color: 'var(--md-on-surface)',
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div
            className="h-48 rounded-xl animate-pulse"
            style={{ background: 'var(--md-surface-container-high)' }}
          />
        }
      >
        <ErrorContent />
      </Suspense>
    </AuthLayout>
  )
}
