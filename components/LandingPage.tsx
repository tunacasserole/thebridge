"use client"

import Image from "next/image"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { ThemeSwitch } from "@/components/ThemeSwitch"
import { useTheme } from "@/lib/theme"

/**
 * Landing page shown to logged-out users
 * Full-screen hero with product features and call-to-action
 */
export function LandingPage() {
  const { currentTheme } = useTheme()
  const isDark = currentTheme.mode === "dark"

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--md-surface)' }}
    >
      {/* Navigation */}
      <nav
        className="h-16 px-6 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--md-outline-variant)' }}
      >
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Image
            src={isDark ? "/thebridge-logo-dark.svg" : "/thebridge-logo-light.svg"}
            alt="TheBridge"
            width={140}
            height={40}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <div className="flex items-center gap-2">
          <ThemeSwitch />
          <button
            onClick={() => signIn("github")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-xs
              transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{
              background: 'var(--md-primary)',
              color: 'var(--md-on-primary)',
            }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex mt-8 lg:mt-12">
        {/* Left Content */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
          <div className="max-w-xl">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{
                background: 'var(--md-primary-container)',
                color: 'var(--md-on-primary-container)',
              }}
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              AI-Powered SRE Platform
            </div>

            {/* Headline */}
            <h1
              className="text-4xl lg:text-5xl font-bold leading-tight mb-6"
              style={{ color: 'var(--md-on-surface)' }}
            >
              Your AI-Powered
              <br />
              <span style={{ color: 'var(--md-primary)' }}>SRE Command Center</span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg lg:text-xl mb-8 leading-relaxed"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              Connect all your observability tools. Let AI agents analyze incidents,
              suggest fixes, and automate responses. Reduce MTTR by 60%.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => signIn("github")}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl
                  font-medium text-base transition-all duration-200
                  hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'var(--md-primary)',
                  color: 'var(--md-on-primary)',
                }}
              >
                <GitHubIcon />
                Get Started with GitHub
              </button>
              <Link
                href="#features"
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl
                  font-medium text-base transition-all duration-200
                  hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'var(--md-surface-container-high)',
                  border: '1px solid var(--md-outline)',
                  color: 'var(--md-on-surface)',
                }}
              >
                <span className="material-symbols-outlined text-xl">play_circle</span>
                Watch Demo
              </Link>
            </div>

            {/* Trust Signals */}
            <div
              className="flex items-center gap-6 mt-8 pt-8"
              style={{ borderTop: '1px solid var(--md-outline-variant)' }}
            >
              <TrustItem icon="check_circle" text="Free to start" />
              <TrustItem icon="lock" text="Enterprise security" />
              <TrustItem icon="bolt" text="5-min setup" />
            </div>
          </div>
        </div>

        {/* Right Visual */}
        <div
          className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg,
              var(--md-primary-container) 0%,
              var(--md-secondary-container) 50%,
              var(--md-surface-container) 100%)`
          }}
        >
          {/* Decorative background pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, var(--md-on-surface) 2px, transparent 0)`,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Feature Cards Stack */}
          <div className="relative w-full max-w-md space-y-4">
            <FeatureCard
              icon="monitoring"
              title="Unified Observability"
              description="Connect Rootly, New Relic, Coralogix, and more in one place"
            />
            <FeatureCard
              icon="psychology"
              title="AI Agents"
              description="Specialized agents for different SRE tasks work together"
            />
            <FeatureCard
              icon="bolt"
              title="Instant Insights"
              description="Get AI-powered analysis of incidents in seconds"
            />
            <FeatureCard
              icon="group"
              title="Team Collaboration"
              description="Share context and coordinate responses efficiently"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-8"
        style={{ background: 'var(--md-surface-container)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: 'var(--md-on-surface)' }}
            >
              Everything you need for SRE excellence
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              Connect your tools, let AI do the heavy lifting, and focus on what matters.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <IntegrationCard
              title="Rootly"
              description="Incident management with full context"
              icon="crisis_alert"
            />
            <IntegrationCard
              title="New Relic"
              description="APM and infrastructure monitoring"
              icon="monitoring"
            />
            <IntegrationCard
              title="Coralogix"
              description="Log analytics and observability"
              icon="description"
            />
            <IntegrationCard
              title="GitHub"
              description="Code and deployment integration"
              icon="code"
            />
            <IntegrationCard
              title="Uptime Kuma"
              description="Status page and uptime monitoring"
              icon="check_circle"
            />
            <IntegrationCard
              title="More Coming"
              description="PagerDuty, Datadog, Slack..."
              icon="add_circle"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-8"
        style={{
          background: 'var(--md-surface)',
          borderTop: '1px solid var(--md-outline-variant)',
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className="text-sm"
            style={{ color: 'var(--md-on-surface-variant)' }}
          >
            &copy; {new Date().getFullYear()} TheBridge. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-sm hover:underline"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm hover:underline"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function GitHubIcon() {
  return (
    <svg
      className="w-5 h-5"
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

function TrustItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="material-symbols-outlined text-lg"
        style={{
          color: 'var(--md-primary)',
          fontVariationSettings: "'FILL' 1",
        }}
      >
        {icon}
      </span>
      <span
        className="text-sm"
        style={{ color: 'var(--md-on-surface-variant)' }}
      >
        {text}
      </span>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div
      className="p-5 rounded-2xl shadow-lg"
      style={{
        background: 'var(--md-surface-container)',
        border: '1px solid var(--md-outline-variant)',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--md-primary-container)',
          }}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: 'var(--md-primary)' }}
          >
            {icon}
          </span>
        </div>
        <div>
          <h3
            className="font-semibold text-base mb-1"
            style={{ color: 'var(--md-on-surface)' }}
          >
            {title}
          </h3>
          <p
            className="text-sm"
            style={{ color: 'var(--md-on-surface-variant)' }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

function IntegrationCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div
      className="p-6 rounded-2xl"
      style={{
        background: 'var(--md-surface)',
        border: '1px solid var(--md-outline-variant)',
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'var(--md-primary-container)' }}
      >
        <span
          className="material-symbols-outlined text-2xl"
          style={{ color: 'var(--md-primary)' }}
        >
          {icon}
        </span>
      </div>
      <h3
        className="font-semibold text-lg mb-2"
        style={{ color: 'var(--md-on-surface)' }}
      >
        {title}
      </h3>
      <p
        className="text-sm"
        style={{ color: 'var(--md-on-surface-variant)' }}
      >
        {description}
      </p>
    </div>
  )
}
