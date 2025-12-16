"use client"

import { Suspense } from "react"
import { signIn, getProviders } from "next-auth/react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AuthLayout } from "@/components/auth"

type Provider = {
  id: string
  name: string
  type: string
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
    <div>
      {/* Page Title */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-3"
          style={{ color: 'var(--md-on-surface)' }}
        >
          Welcome Back
        </h1>
        <p
          className="text-base"
          style={{ color: 'var(--md-on-surface-variant)' }}
        >
          Sign in to access your SRE command center and AI-powered incident management.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-6 p-4 rounded-xl"
          style={{
            background: 'var(--md-error-container)',
            border: '1px solid var(--md-error)',
          }}
        >
          <p
            className="text-sm"
            style={{ color: 'var(--md-on-error-container)' }}
          >
            {error === "OAuthAccountNotLinked"
              ? "This email is already associated with another account."
              : "An error occurred during sign in. Please try again."}
          </p>
        </div>
      )}

      {/* Provider Buttons */}
      <div className="space-y-4">
        {providers === null ? (
          // Loading skeleton
          <div className="space-y-4">
            <div
              className="h-14 rounded-xl animate-pulse"
              style={{ background: 'var(--md-surface-container-high)' }}
            />
          </div>
        ) : Object.keys(providers).length === 0 ? (
          // No providers configured
          <div className="text-center py-6">
            <span
              className="material-symbols-outlined text-4xl mb-4 block"
              style={{ color: 'var(--md-error)' }}
            >
              warning
            </span>
            <p
              className="text-sm mb-3"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              No authentication providers configured.
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              Add GitHub OAuth credentials (GITHUB_ID, GITHUB_SECRET)
              to your environment variables.
            </p>
          </div>
        ) : (
          <>
            {/* GitHub Sign In Button - Primary option */}
            {providers.github && (
              <button
                onClick={() => handleSignIn("github")}
                disabled={isLoading !== null}
                className="w-full flex items-center justify-center gap-3 px-6 py-4
                  rounded-xl font-medium text-base
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'var(--md-surface-container-high)',
                  border: '1px solid var(--md-outline)',
                  color: 'var(--md-on-surface)',
                }}
              >
                {isLoading === "github" ? (
                  <span
                    className="w-6 h-6 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: 'var(--md-outline)',
                      borderTopColor: 'var(--md-primary)',
                    }}
                  />
                ) : (
                  <GitHubIcon />
                )}
                Continue with GitHub
              </button>
            )}
          </>
        )}
      </div>

      {/* Terms */}
      <p
        className="text-center text-xs mt-8"
        style={{ color: 'var(--md-on-surface-variant)' }}
      >
        By signing in, you agree to our{" "}
        <Link
          href="/terms"
          className="hover:underline"
          style={{ color: 'var(--md-primary)' }}
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="hover:underline"
          style={{ color: 'var(--md-primary)' }}
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  )
}

function GitHubIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function SignInPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="space-y-4">
            <div
              className="h-14 rounded-xl animate-pulse"
              style={{ background: 'var(--md-surface-container-high)' }}
            />
          </div>
        }
      >
        <SignInContent />
      </Suspense>
    </AuthLayout>
  )
}
