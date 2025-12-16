/**
 * Coralogix Logo (Icon Mark)
 * Source: Official Coralogix brand assets
 * License: Trademark
 * Brand Colors: Teal Green (#3CC48F), Mint (#AEFFDC)
 */

interface CoralogixLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function CoralogixLogo({
  className,
  width = 24,
  height = 24,
}: CoralogixLogoProps) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 116 116"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Coralogix</title>
      {/* Coralogix "C" icon - extracted from official logo */}
      {/* Solid filled circle */}
      <ellipse
        cx="58.12"
        cy="58.04"
        rx="52.28"
        ry="52.28"
        fill="#3CC48F"
      />
      {/* Ring outline (the "C" shape) */}
      <path
        fill="#AEFFDC"
        d="M58.12,116.08C26.06,116.08,0,90.03,0,58.04C0,25.97,26.06,0,58.12,0s58.12,26.06,58.12,58.12C116.16,90.03,90.11,116.08,58.12,116.08z M58.12,11.44c-25.64,0-46.52,20.88-46.52,46.52c0,25.64,20.88,46.52,46.52,46.52s46.52-20.88,46.52-46.52C104.64,32.32,83.76,11.44,58.12,11.44z"
      />
    </svg>
  );
}
