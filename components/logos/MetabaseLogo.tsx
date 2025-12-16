/**
 * Metabase Logo
 * Source: GitHub official repository (metabase/metabase)
 * License: Open Source (AGPL)
 * Brand Color: Blue (#509EE3)
 */

interface MetabaseLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function MetabaseLogo({
  className,
  width = 24,
  height = 24,
}: MetabaseLogoProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <title>Metabase</title>
      {/* White circle with blue border */}
      <circle cx="32" cy="32" r="28" fill="white" stroke="#509EE3" strokeWidth="4" />
      {/* Light blue background dots */}
      <g fill="#A5D4F3">
        {/* Row 1 */}
        <circle cx="24" cy="16" r="2.5" />
        <circle cx="32" cy="16" r="2.5" />
        <circle cx="40" cy="16" r="2.5" />
        {/* Row 2 */}
        <circle cx="32" cy="23" r="2.5" />
        {/* Row 3 */}
        <circle cx="32" cy="30" r="2.5" />
        {/* Row 5 */}
        <circle cx="24" cy="44" r="2.5" />
        <circle cx="32" cy="44" r="2.5" />
        <circle cx="40" cy="44" r="2.5" />
      </g>
      {/* Dark blue M-shaped dots */}
      <g fill="#509EE3">
        {/* Row 1 - top of M */}
        <circle cx="16" cy="16" r="2.5" />
        <circle cx="48" cy="16" r="2.5" />
        {/* Row 2 - M arms going down */}
        <circle cx="16" cy="23" r="2.5" />
        <circle cx="24" cy="23" r="2.5" />
        <circle cx="40" cy="23" r="2.5" />
        <circle cx="48" cy="23" r="2.5" />
        {/* Row 3 - M middle */}
        <circle cx="16" cy="30" r="2.5" />
        <circle cx="24" cy="30" r="2.5" />
        <circle cx="40" cy="30" r="2.5" />
        <circle cx="48" cy="30" r="2.5" />
        {/* Row 4 - M legs */}
        <circle cx="16" cy="37" r="2.5" />
        <circle cx="32" cy="37" r="2.5" />
        <circle cx="48" cy="37" r="2.5" />
        {/* Row 5 - M bottom */}
        <circle cx="16" cy="44" r="2.5" />
        <circle cx="48" cy="44" r="2.5" />
      </g>
    </svg>
  );
}
