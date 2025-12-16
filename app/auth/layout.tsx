/**
 * Auth Layout - Special layout for auth pages
 * Removes the standard header/footer chrome so auth pages
 * can use their own full-screen split layout
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--md-surface)]">
      {children}
    </div>
  )
}
