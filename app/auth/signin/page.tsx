"use client"

import { Suspense } from "react"
import { signIn, getProviders } from "next-auth/react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Icon from "@/components/ui/Icon"

type Provider = {
  id: string
  name: string
  type: string
}

const providerIcons: Record<string, string> = {
  github: "code",
  google: "mail",
}

function SignInContent() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const error = searchParams.get("error")

  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

  const handleSignIn = async (providerId: string) => {
    setIsLoading(providerId)
    await signIn(providerId, { callbackUrl })
  }

  return (
    <>
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-md-error-container/20 border border-md-error/30">
          <p className="text-sm text-md-error text-center">
            {error === "OAuthAccountNotLinked"
              ? "This email is already associated with another account."
              : "An error occurred during sign in. Please try again."}
          </p>
        </div>
      )}

      {/* Provider Buttons */}
      <div className="space-y-3">
        {providers ? (
          Object.values(providers).map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleSignIn(provider.id)}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3
                rounded-xl border border-md-outline
                bg-md-surface hover:bg-md-surface-container-high
                text-md-on-surface font-medium
                transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === provider.id ? (
                <span className="w-5 h-5 border-2 border-md-primary/30 border-t-md-primary rounded-full animate-spin" />
              ) : (
                <Icon name={providerIcons[provider.id] || "account_circle"} size={20} />
              )}
              Continue with {provider.name}
            </button>
          ))
        ) : (
          // Loading skeleton
          <div className="space-y-3">
            <div className="h-12 rounded-xl bg-md-surface-container-high animate-pulse" />
            <div className="h-12 rounded-xl bg-md-surface-container-high animate-pulse" />
          </div>
        )}
      </div>
    </>
  )
}

export default function SignInPage() {
  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
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

        {/* Card */}
        <div className="bg-md-surface-container rounded-2xl p-8 shadow-lg border border-md-outline-variant">
          <h1 className="text-xl font-semibold text-md-on-surface text-center mb-2">
            Welcome to TheBridge
          </h1>
          <p className="text-sm text-md-on-surface-variant text-center mb-6">
            Sign in to access your SRE command center
          </p>

          <Suspense fallback={
            <div className="space-y-3">
              <div className="h-12 rounded-xl bg-md-surface-container-high animate-pulse" />
              <div className="h-12 rounded-xl bg-md-surface-container-high animate-pulse" />
            </div>
          }>
            <SignInContent />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="text-xs text-md-on-surface-variant text-center mt-6">
          By signing in, you agree to our{" "}
          <a href="/terms" className="text-md-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-md-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
