'use client';

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

      {/* Center: SRE Wisdom - true center using flex-1 */}
      <div className="flex-1 flex justify-center">
        <p className="hidden md:block text-xs italic text-[var(--md-on-surface-variant)]">
          &ldquo;Hope is not a strategy.&rdquo;
        </p>
      </div>

      {/* Right: Empty spacer to balance copyright */}
      <div className="w-24 pr-4" />
    </footer>
  );
}
