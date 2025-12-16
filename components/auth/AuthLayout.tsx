"use client"

import Image from "next/image"
import Link from "next/link"
import { ThemeSwitch } from "@/components/ThemeSwitch"
import { useTheme } from "@/lib/theme"

interface AuthLayoutProps {
  children: React.ReactNode
  /** Optional testimonial to display */
  testimonial?: {
    quote: string
    author: string
    role: string
    avatar?: string
  }
}

/**
 * Split-screen auth layout inspired by Nexus design pattern
 * Features:
 * - Left side: Illustration with testimonial overlay (hidden on mobile)
 * - Right side: Form content with logo and theme toggle
 * - Fully themable using CSS variables
 */
export function AuthLayout({ children, testimonial }: AuthLayoutProps) {
  const { currentTheme } = useTheme()
  const isDark = currentTheme.mode === "dark"

  const defaultTestimonial = {
    quote: "TheBridge transformed our incident response. AI-driven insights have never been this intuitive!",
    author: "Jason Ihaia",
    role: "VP Engineering",
    avatar: undefined,
  }

  const displayTestimonial = testimonial || defaultTestimonial

  return (
    <div className="min-h-screen flex bg-[var(--md-surface)]">
      {/* Left Side: Illustration and Testimonial */}
      <div
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12"
        style={{
          background: `linear-gradient(135deg,
            var(--md-primary-container) 0%,
            var(--md-secondary-container) 50%,
            var(--md-tertiary-container) 100%)`
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

        {/* Main content container */}
        <div className="relative w-full max-w-xl flex flex-col items-center justify-center">
          {/* Large logo or illustration */}
          <div className="mb-8">
            <Image
              src={isDark ? "/thebridge-logo-dark.svg" : "/thebridge-logo-light.svg"}
              alt="TheBridge"
              width={240}
              height={70}
              priority
              className="h-16 w-auto"
            />
          </div>

          {/* Feature highlights */}
          <div className="space-y-4 mb-8">
            <FeatureItem
              icon="monitoring"
              title="Unified Observability"
              description="Connect all your monitoring tools in one place"
            />
            <FeatureItem
              icon="psychology"
              title="AI-Powered Insights"
              description="Let AI agents analyze incidents and suggest fixes"
            />
            <FeatureItem
              icon="speed"
              title="Faster Resolution"
              description="Reduce MTTR with intelligent automation"
            />
          </div>

          {/* Testimonial Card */}
          <div
            className="w-full max-w-md p-6 rounded-2xl shadow-xl"
            style={{
              background: 'var(--md-surface-container)',
              border: '1px solid var(--md-outline-variant)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
                style={{
                  background: 'linear-gradient(135deg, var(--md-primary), var(--md-secondary))',
                  color: 'var(--md-on-primary)',
                }}
              >
                {displayTestimonial.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <p
                  className="font-semibold text-sm"
                  style={{ color: 'var(--md-on-surface)' }}
                >
                  {displayTestimonial.author}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--md-on-surface-variant)' }}
                >
                  {displayTestimonial.role}
                </p>
              </div>
              {/* Star rating */}
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className="material-symbols-outlined text-sm"
                    style={{
                      color: 'var(--md-warning)',
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    star
                  </span>
                ))}
              </div>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              &ldquo;{displayTestimonial.quote}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Form Content */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12"
        style={{ background: 'var(--md-surface)' }}
      >
        <div className="w-full max-w-md">
          {/* Header with Logo and Theme Toggle */}
          <div className="flex items-center justify-between mb-12">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image
                src={isDark ? "/thebridge-logo-dark.svg" : "/thebridge-logo-light.svg"}
                alt="TheBridge"
                width={140}
                height={40}
                priority
                className="h-10 w-auto"
              />
            </Link>

            <ThemeSwitch />
          </div>

          {/* Main Form Content */}
          {children}
        </div>
      </div>
    </div>
  )
}

/** Feature item for the left panel */
function FeatureItem({
  icon,
  title,
  description
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: 'var(--md-surface-container)',
          border: '1px solid var(--md-outline-variant)',
        }}
      >
        <span
          className="material-symbols-outlined text-xl"
          style={{ color: 'var(--md-primary)' }}
        >
          {icon}
        </span>
      </div>
      <div>
        <h3
          className="font-semibold text-sm"
          style={{ color: 'var(--md-on-surface)' }}
        >
          {title}
        </h3>
        <p
          className="text-xs"
          style={{ color: 'var(--md-on-surface-variant)' }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}
