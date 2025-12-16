"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import Icon from "@/components/ui/Icon"

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
    <>
      {/* Error Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-md-error-container flex items-center justify-center">
          <Icon name="error" size={32} className="text-md-error" />
        </div>
      </div>

      {/* Error Message */}
      <h1 className="text-xl font-semibold text-md-on-surface mb-2">{title}</h1>
      <p className="text-sm text-md-on-surface-variant mb-8">{description}</p>
    </>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/thebridge-logo-dark.svg"
            alt="TheBridge"
            width={180}
            height={50}
            priority
            className="h-12 w-auto"
          />
        </div>

        <Suspense fallback={<div className="h-32 animate-pulse" />}>
          <ErrorContent />
        </Suspense>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full px-4 py-3 rounded-xl
              bg-md-primary text-md-on-primary font-medium
              hover:bg-md-primary/90 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="block w-full px-4 py-3 rounded-xl
              border border-md-outline text-md-on-surface font-medium
              hover:bg-md-surface-container-high transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
