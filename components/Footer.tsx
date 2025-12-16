'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="h-16 border-t border-[var(--md-outline-variant)] bg-[var(--md-surface)] flex items-center">
      {/* Left: Copyright - fixed width to balance the right side */}
      <div className="w-24 pl-4">
        <span className="text-xs text-[var(--md-on-surface-variant)]">
          &copy; {currentYear}
        </span>
      </div>

      {/* Center: SRE Wisdom and Links - true center using flex-1 */}
      <div className="flex-1 flex justify-center items-center gap-4">
        <p className="hidden md:block text-xs italic text-[var(--md-on-surface-variant)]">
          &ldquo;Hope is not a strategy.&rdquo;
        </p>
        <span className="hidden md:block text-[var(--md-outline-variant)]">|</span>
        <Link
          href="/code"
          className="text-xs text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] transition-colors duration-200"
          title="View code examples"
        >
          Code
        </Link>
      </div>

      {/* Right: Empty spacer to balance copyright */}
      <div className="w-24 pr-4" />
    </footer>
  );
}
